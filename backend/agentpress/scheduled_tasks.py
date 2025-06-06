import json
import uuid
from datetime import datetime, timedelta, time, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from utils.logger import logger
from utils.auth_utils import get_current_user_id_from_jwt
from services.supabase import DBConnection
from services import billing as billing_api
import asyncio
import calendar

# Imports for periodiq and dramatiq actor
from periodiq import cron
import dramatiq

router = APIRouter(prefix="/scheduled-tasks", tags=["scheduled-tasks"])
db = DBConnection()

class ScheduledTaskCreate(BaseModel):
    agent_id: Optional[str] = None
    thread_id: Optional[str] = None
    prompt: Optional[str] = None
    schedule_type: str = Field(..., pattern="^(hourly|daily|weekly|monthly)$")
    
    minute_of_hour: Optional[int] = Field(None, ge=0, le=59, description="Minute of the hour (0-59) for the task. Relevant for 'hourly'. Can refine 'daily', 'weekly', 'monthly' if time_of_day is also set.")
    time_of_day: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$", description="Time of day (HH:MM UTC). Required for 'daily', 'weekly', 'monthly'.")
    day_of_month: Optional[int] = Field(None, ge=1, le=31, description="Day of the month (1-31). Required for 'monthly'.")
    days_of_week: Optional[List[int]] = Field(None, description="Days of the week (0=Sunday, ..., 6=Saturday). Required for 'weekly'.")
    model_name: Optional[str] = Field(None, description="The LLM model to use for this task. If None, agent's default or system default will be used.")

    @validator('minute_of_hour', always=True)
    def validate_minute_of_hour(cls, v, values):
        schedule_type = values.get('schedule_type')
        if schedule_type == 'hourly' and v is None:
            logger.info("minute_of_hour not provided for hourly schedule, defaulting to 0 (top of the hour).")
            return 0
        return v

    @validator('time_of_day', always=True)
    def validate_time_of_day(cls, v, values):
        schedule_type = values.get('schedule_type')
        if schedule_type in ('daily', 'weekly', 'monthly') and v is None:
            raise ValueError('time_of_day (HH:MM) is required for daily, weekly, or monthly schedules.')
        if schedule_type == 'hourly' and v is not None:
            logger.warning("time_of_day is ignored for hourly schedules; use minute_of_hour.")
            return None
        return v

    @validator('day_of_month', always=True)
    def validate_day_of_month(cls, v, values):
        schedule_type = values.get('schedule_type')
        if schedule_type == 'monthly' and v is None:
            raise ValueError('day_of_month (1-31) is required for monthly schedules.')
        if schedule_type != 'monthly' and v is not None:
            logger.warning("day_of_month is ignored for non-monthly schedules.")
            return None
        return v

    @validator('days_of_week', always=True)
    def validate_days_of_week(cls, v, values):
        schedule_type = values.get('schedule_type')
        if schedule_type == 'weekly':
            if not v or not isinstance(v, list) or not v:
                raise ValueError('days_of_week (list of 0-6) is required for weekly schedules.')
            for day_val in v:
                if not (0 <= day_val <= 6):
                    raise ValueError('days_of_week must contain integers between 0 (Sunday) and 6 (Saturday).')
        elif v is not None:
             logger.warning("days_of_week is ignored for non-weekly schedules.")
             return None
        return v

class ScheduledTaskUpdate(BaseModel):
    is_active: Optional[bool] = None
    schedule_type: Optional[str] = Field(None, pattern="^(hourly|daily|weekly|monthly)$")
    prompt: Optional[str] = None
    minute_of_hour: Optional[int] = Field(None, ge=0, le=59)
    time_of_day: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):([0-5]\d)$")
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    days_of_week: Optional[List[int]] = None
    model_name: Optional[str] = None

class ScheduledTaskOut(BaseModel):
    id: str
    agent_id: Optional[str] = None
    thread_id: Optional[str] = None
    project_id: Optional[str] = None
    prompt: Optional[str] = None
    schedule_type: str
    days_of_week: Optional[List[int]] = None
    time_of_day: Optional[str] = None
    minute_of_hour: Optional[int] = None
    day_of_month: Optional[int] = None
    model_name: Optional[str] = None
    next_run_at: datetime
    last_run_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

class ScheduledTaskRunOut(BaseModel):
    id: str
    scheduled_task_id: str
    agent_run_id: Optional[str] = None
    thread_id: Optional[str] = None
    task_run_time: datetime
    status: str
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

def _parse_time_of_day(time_str: Optional[str]) -> time:
    if not time_str:
        return time(0, 0, tzinfo=timezone.utc)
    try:
        # *** FIXED LOGIC: Handle "HH:MM:SS" format from the database ***
        parts = list(map(int, time_str.split(':')))
        h, m = parts[0], parts[1]
        return time(h, m, tzinfo=timezone.utc)
    except (ValueError, IndexError):
        logger.error(f"Invalid time_of_day format: {time_str}. Expected HH:MM or HH:MM:SS.", exc_info=True)
        return time(0, 0, tzinfo=timezone.utc)

def get_next_run_at(
    schedule_type: str,
    time_of_day_str: Optional[str],
    days_of_week: Optional[List[int]],
    day_of_month: Optional[int],
    minute_of_hour: Optional[int],
    from_dt: Optional[datetime] = None
) -> datetime:
    now = from_dt or datetime.now(timezone.utc)
    
    if schedule_type == 'hourly':
        target_minute = minute_of_hour if minute_of_hour is not None else 0
        next_run_candidate = now.replace(minute=target_minute, second=0, microsecond=0)
        if next_run_candidate <= now:
            next_run_candidate = (now + timedelta(hours=1)).replace(minute=target_minute, second=0, microsecond=0)
        return next_run_candidate

    if not time_of_day_str:
        raise ValueError("time_of_day is required for daily, weekly, or monthly schedules.")

    parsed_time = _parse_time_of_day(time_of_day_str)
    
    # *** FIXED LOGIC: Construct datetime from parts instead of using now.replace() ***
    def get_candidate(date_part: datetime.date) -> datetime:
        return datetime.combine(date_part, parsed_time).replace(tzinfo=timezone.utc)

    if schedule_type == "daily":
        next_run_candidate = get_candidate(now.date())
        if next_run_candidate <= now:
            next_run_candidate = get_candidate((now + timedelta(days=1)).date())

    elif schedule_type == "weekly":
        if not days_of_week: raise ValueError("days_of_week is required for weekly schedule")
        
        # Start checking from today
        next_run_candidate = get_candidate(now.date())
        
        # If the time for today has already passed, start checking from tomorrow
        if next_run_candidate <= now:
            next_run_candidate = get_candidate((now + timedelta(days=1)).date())
        
        # Iterate until we find a valid day of the week
        # Python's isoweekday(): Mon=1..Sun=7. User input: Sun=0..Sat=6
        # To match user input, we use (isoweekday() % 7) which gives Sun=0..Sat=6
        while (next_run_candidate.isoweekday() % 7) not in days_of_week:
            next_run_candidate += timedelta(days=1)

    elif schedule_type == "monthly":
        if day_of_month is None: raise ValueError("day_of_month is required for monthly schedule")
        
        current_year, current_month = now.year, now.month
        
        # Try current month
        try:
            candidate_date = datetime(current_year, current_month, day_of_month, tzinfo=timezone.utc).date()
            next_run_candidate = get_candidate(candidate_date)
            if next_run_candidate > now:
                return next_run_candidate
        except ValueError: # Day is invalid for current month (e.g., 31st in Feb)
            pass

        # If current month's date has passed or was invalid, try next month
        next_month_year = current_year
        next_month = current_month + 1
        if next_month > 12:
            next_month = 1
            next_month_year += 1
        
        last_day_of_next_month = calendar.monthrange(next_month_year, next_month)[1]
        actual_day_to_run = min(day_of_month, last_day_of_next_month)
        
        candidate_date = datetime(next_month_year, next_month, actual_day_to_run, tzinfo=timezone.utc).date()
        next_run_candidate = get_candidate(candidate_date)
        
    else:
        raise ValueError(f"Unhandled schedule_type: {schedule_type}")

    logger.info(f"Final calculated next_run_at: {next_run_candidate.isoformat()} for schedule input.")
    return next_run_candidate

@router.get("/", response_model=List[ScheduledTaskOut])
async def list_scheduled_tasks(user_id: str = Depends(get_current_user_id_from_jwt)):
    client = await db.client
    tasks_query = await client.table("scheduled_tasks").select("*").eq("account_id", user_id).order("created_at", desc=True).execute()
    return tasks_query.data

@router.post("/", response_model=ScheduledTaskOut)
async def create_scheduled_task(
    data: ScheduledTaskCreate, user_id: str = Depends(get_current_user_id_from_jwt)
):
    client = await db.client
    can_run, msg, sub = await billing_api.check_billing_status(client, user_id)
    if not can_run:
        raise HTTPException(status_code=402, detail=msg)

    if not data.agent_id and not data.thread_id:
        raise HTTPException(status_code=400, detail="Must specify agent_id or thread_id")
    
    try:
        next_run = get_next_run_at(
            data.schedule_type, data.time_of_day, data.days_of_week,
            data.day_of_month, data.minute_of_hour
        )
    except ValueError as e:
        logger.error(f"Error calculating next_run_at on create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid schedule configuration: {str(e)}")
    
    account_id = user_id
    project_id = None
    if data.thread_id:
        thread_query = await client.table("threads").select("project_id").eq("thread_id", data.thread_id).maybe_single().execute()
        if thread_query and thread_query.data:
            project_id = thread_query.data.get("project_id")

    task_id = str(uuid.uuid4())
    record = {
        "id": task_id, "account_id": account_id, "agent_id": data.agent_id,
        "thread_id": data.thread_id, "project_id": project_id, "created_by": user_id,
        "prompt": data.prompt, "schedule_type": data.schedule_type,
        "days_of_week": data.days_of_week, 
        "time_of_day": data.time_of_day,
        "day_of_month": data.day_of_month,
        "minute_of_hour": data.minute_of_hour,
        "model_name": data.model_name,
        "next_run_at": next_run.isoformat(), "is_active": True
    }
    result = await client.table("scheduled_tasks").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create scheduled task")
    return result.data[0]

@router.put("/{task_id}", response_model=ScheduledTaskOut)
async def update_scheduled_task(
    task_id: str, data: ScheduledTaskUpdate, user_id: str = Depends(get_current_user_id_from_jwt)
):
    client = await db.client
    task_query = await client.table("scheduled_tasks").select("*").eq("id", task_id).eq("account_id", user_id).maybe_single().execute()
    if not task_query.data:
        raise HTTPException(status_code=404, detail="Scheduled task not found or access denied")
    
    existing_task = task_query.data
    update_payload = data.dict(exclude_unset=True)

    schedule_fields_updated = any(k in update_payload for k in [
        "schedule_type", "time_of_day", "days_of_week", 
        "day_of_month", "minute_of_hour"
    ])

    if schedule_fields_updated:
        current_schedule_type = update_payload.get("schedule_type", existing_task["schedule_type"])
        current_time_of_day = update_payload.get("time_of_day", existing_task.get("time_of_day"))
        current_days_of_week = update_payload.get("days_of_week", existing_task.get("days_of_week"))
        current_day_of_month = update_payload.get("day_of_month", existing_task.get("day_of_month"))
        current_minute_of_hour = update_payload.get("minute_of_hour", existing_task.get("minute_of_hour"))
        
        if current_schedule_type == 'hourly' and current_minute_of_hour is None:
            current_minute_of_hour = 0
            if "minute_of_hour" not in update_payload: update_payload["minute_of_hour"] = 0
        if current_schedule_type in ('daily', 'weekly', 'monthly') and not current_time_of_day:
            raise HTTPException(status_code=400, detail="time_of_day is required for daily/weekly/monthly schedules.")
        if current_schedule_type == 'monthly' and current_day_of_month is None:
            raise HTTPException(status_code=400, detail="day_of_month is required for monthly schedules.")
        if current_schedule_type == 'weekly' and not current_days_of_week:
            raise HTTPException(status_code=400, detail="days_of_week is required for weekly schedules.")

        try:
            update_payload["next_run_at"] = get_next_run_at(
                current_schedule_type, current_time_of_day, current_days_of_week,
                current_day_of_month, current_minute_of_hour
            ).isoformat()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid schedule update: {str(e)}")

    result = await client.table("scheduled_tasks").update(update_payload).eq("id", task_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update scheduled task")
    return result.data[0]

@router.delete("/{task_id}")
async def delete_scheduled_task(task_id: str, user_id: str = Depends(get_current_user_id_from_jwt)):
    client = await db.client
    task_check = await client.table("scheduled_tasks").select("id").eq("id", task_id).eq("account_id", user_id).maybe_single().execute()
    if not task_check.data:
        raise HTTPException(status_code=404, detail="Scheduled task not found or access denied")
    await client.table("scheduled_tasks").delete().eq("id", task_id).execute()
    return {"deleted": True}

@router.get("/{task_id}/runs", response_model=List[ScheduledTaskRunOut])
async def list_task_runs(task_id: str, user_id: str = Depends(get_current_user_id_from_jwt)):
    client = await db.client
    task_check = await client.table("scheduled_tasks").select("id").eq("id", task_id).eq("account_id", user_id).maybe_single().execute()
    if not task_check.data:
        raise HTTPException(status_code=404, detail="Scheduled task not found or access denied")
    runs_query = await client.table("scheduled_task_runs").select("*").eq("scheduled_task_id", task_id).order("created_at", desc=True).execute()
    return runs_query.data

@dramatiq.actor(periodic=cron('*/1 * * * *'))
async def scheduled_task_runner():
    logger.debug("scheduled_task_runner actor started")
    try:
        await _run_due_scheduled_tasks()
        logger.debug("scheduled_task_runner actor finished successfully")
    except Exception as e:
        logger.error(f"Unhandled error in scheduled_task_runner: {str(e)}", exc_info=True)

async def _run_due_scheduled_tasks():
    client = await db.client
    now = datetime.now(timezone.utc)
    
    tasks_query = await client.table("scheduled_tasks").select("*").eq("is_active", True).lte("next_run_at", now.isoformat()).execute()
    tasks_data = tasks_query.data
    
    logger.info(f"Scheduler: Found {len(tasks_data)} scheduled tasks due to run")
    
    for task_dict in tasks_data:
        try:
            await _run_scheduled_task(task_dict, client)
        except Exception as e:
            logger.error(f"Scheduler: Error processing task {task_dict['id']}: {str(e)}", exc_info=True)

async def _run_scheduled_task(task: Dict[str, Any], client):
    logger.info(f"Running scheduled task {task['id']} for account {task['account_id']}")
    
    thread_id = task.get("thread_id")
    target_agent_id = task.get("agent_id")
    prompt = task.get("prompt")
    project_id = task.get("project_id")
    account_id = task.get("account_id")
    
    if not target_agent_id and not thread_id:
        logger.error(f"Task {task['id']} requires an agent_id if no thread_id is specified. Skipping.")
        await client.table("scheduled_tasks").update({"is_active": False, "error_message": "Missing agent_id for new thread creation"}).eq("id", task["id"]).execute()
        return

    if not thread_id:
        logger.info(f"No thread_id for task {task['id']}. Creating new project and thread.")
        project_name = f"Scheduled: {task.get('prompt', task['id'][:8])}"
        project_insert_query = await client.table("projects").insert({"account_id": account_id, "name": project_name}).execute()
        if not project_insert_query.data: logger.error(f"Failed to create project for task {task['id']}"); return
        project_id = project_insert_query.data[0]['project_id']
        
        thread_insert_query = await client.table("threads").insert({"project_id": project_id, "account_id": account_id, "agent_id": target_agent_id}).execute()
        if not thread_insert_query.data: logger.error(f"Failed to create thread for task {task['id']}"); return
        thread_id = thread_insert_query.data[0]['thread_id']
        
        await client.table("scheduled_tasks").update({"thread_id": thread_id, "project_id": project_id}).eq("id", task["id"]).execute()
        logger.info(f"Created new thread {thread_id} (project {project_id}) for task {task['id']} with agent {target_agent_id}.")

    if prompt:
        logger.info(f"Adding prompt to thread {thread_id} for task {task['id']}")
        message_payload_for_db = {"role": "user", "content": prompt}
        await client.table("messages").insert({
            "thread_id": thread_id,
            "type": "user",
            "is_llm_message": True, 
            "content": json.dumps(message_payload_for_db),
        }).execute()
        
    agent_to_use_id = target_agent_id
    if not agent_to_use_id and thread_id:
        thread_data_query = await client.table("threads").select("agent_id").eq("thread_id", thread_id).maybe_single().execute()
        if thread_data_query and thread_data_query.data:
            agent_to_use_id = thread_data_query.data.get("agent_id")
    
    if not agent_to_use_id:
        default_agent_query = await client.table("agents").select("agent_id").eq("account_id", account_id).eq("is_default", True).maybe_single().execute()
        if default_agent_query and default_agent_query.data:
            agent_to_use_id = default_agent_query.data.get("agent_id")

    agent_config_for_run = None
    if agent_to_use_id:
        logger.info(f"Agent {agent_to_use_id} determined for task {task['id']}. Fetching configuration.")
        agent_config_query = await client.table("agents").select("*").eq("agent_id", agent_to_use_id).eq("account_id", account_id).maybe_single().execute()
        if agent_config_query and agent_config_query.data:
            agent_config_for_run = agent_config_query.data
        else:
            logger.warning(f"Agent {agent_to_use_id} not found or inaccessible for task {task['id']}. Proceeding without specific agent config.")
    else:
        logger.warning(f"No specific agent determined for task {task['id']}. Falling back to default agent with full capabilities.")

    new_agent_run_id = str(uuid.uuid4())
    await client.table("agent_runs").insert({"id": new_agent_run_id, "thread_id": thread_id, "status": "running", "started_at": datetime.now(timezone.utc).isoformat()}).execute()
    
    await client.table("scheduled_task_runs").insert({"id": str(uuid.uuid4()), "scheduled_task_id": task["id"], "agent_run_id": new_agent_run_id, "thread_id": thread_id, "task_run_time": datetime.now(timezone.utc).isoformat(), "status": "triggered"}).execute()
    
    from run_agent_background import run_agent_background 
    
    task_model_name = task.get("model_name") 

    model_for_run = task_model_name
    if not model_for_run and agent_config_for_run:
        model_for_run = agent_config_for_run.get("model_name")
    
    logger.info(f"Dispatching agent run {new_agent_run_id} for task {task['id']} (agent: {agent_to_use_id or 'Default Suna'}) using model: {model_for_run or 'Default'}")
    run_agent_background.send(
        agent_run_id=new_agent_run_id, 
        thread_id=thread_id, 
        instance_id="scheduled_task_worker",
        project_id=project_id, 
        model_name=model_for_run,
        enable_thinking=agent_config_for_run.get("enable_thinking", False) if agent_config_for_run else False,
        reasoning_effort=agent_config_for_run.get("reasoning_effort", "low") if agent_config_for_run else "low",
        stream=True, 
        enable_context_manager=True, 
        agent_config=agent_config_for_run,
        is_agent_builder=False, 
        target_agent_id=agent_to_use_id
    )
    
    next_run_at_dt = get_next_run_at(
        task["schedule_type"], task.get("time_of_day"), task.get("days_of_week"),
        task.get("day_of_month"), task.get("minute_of_hour"),
        from_dt=datetime.now(timezone.utc)
    )
    await client.table("scheduled_tasks").update({"last_run_at": datetime.now(timezone.utc).isoformat(), "next_run_at": next_run_at_dt.isoformat()}).eq("id", task["id"]).execute()
    logger.info(f"Task {task['id']} processed. Next run: {next_run_at_dt.isoformat()}")
