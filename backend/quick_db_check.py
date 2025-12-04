import asyncio
import sys
sys.path.insert(0, '/app')
from core.services.supabase import DBConnection

async def main():
    db = DBConnection()
    await db.initialize()
    client = await db.client

    print("="*80)
    print("CHECKING RECENT AGENT RUNS")
    print("="*80)

    runs = client.table('agent_runs').select('id, metadata, created_at').order('created_at', desc=True).limit(20).execute()

    for run in runs.data:
        meta = run.get('metadata', {}) or {}
        model = meta.get('model_name', '')
        if 'bedrock' in str(model).lower() or 'arn:aws' in str(model):
            print(f"⚠️  Run {run['id']}: {model}")

    print("\n" + "="*80)
    print("CHECKING THREADS")
    print("="*80)

    threads = client.table('threads').select('thread_id, model_name, created_at').order('created_at', desc=True).limit(20).execute()

    for thread in threads.data:
        model = thread.get('model_name', '')
        if model and ('bedrock' in str(model).lower() or 'arn:aws' in str(model)):
            print(f"⚠️  Thread {thread['thread_id']}: {model}")

    print("\nDone")

if __name__ == "__main__":
    asyncio.run(main())
