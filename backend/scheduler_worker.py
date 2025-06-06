# scheduler_worker.py

import os
import sys
import logging
import dramatiq
from dramatiq.brokers.rabbitmq import RabbitmqBroker
from periodiq import PeriodiqMiddleware

# --- Logging Setup (Optional, but recommended for debugging) ---
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] [%(module)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("scheduler_worker")

# --- Broker Setup ---
rabbitmq_host = os.getenv('RABBITMQ_HOST', 'rabbitmq')
rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))

rabbitmq_broker = RabbitmqBroker(
    host=rabbitmq_host,
    port=rabbitmq_port,
)
rabbitmq_broker.add_middleware(dramatiq.middleware.AsyncIO())
rabbitmq_broker.add_middleware(PeriodiqMiddleware(skip_delay=30))  # 30s skip delay for missed jobs

dramatiq.set_broker(rabbitmq_broker)

# --- Import the periodic actor after broker is set ---
try:
    from agentpress.scheduled_tasks import scheduled_task_runner
    logger.info("Successfully imported scheduled_task_runner from agentpress.scheduled_tasks")
except Exception as e:
    logger.error(f"Failed to import scheduled_task_runner: {e}")
    raise

# --- Optionally, add a healthcheck actor for debugging ---
@dramatiq.actor
def scheduler_healthcheck():
    logger.info("Scheduler worker healthcheck OK.")

# --- Main guard is not needed; periodiq CLI will run this module as a script ---

# If you want to run manual tests, you can add:
if __name__ == "__main__":
    print("This module is intended to be run with: periodiq -v scheduler_worker")
    print("It will register periodic actors and run scheduled tasks.")
