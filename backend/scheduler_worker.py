# scheduler_worker.py

import os
import sys
import logging
import dramatiq
import urllib.parse  # Added for URL parsing
from dramatiq.brokers.rabbitmq import RabbitmqBroker
from periodiq import PeriodiqMiddleware

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] [%(module)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("scheduler_worker")

# --- UPDATED RABBITMQ CONNECTION LOGIC ---
try:
    # Define the middleware list once to be used in all broker configurations
    middleware = [
        dramatiq.middleware.AsyncIO(),
        PeriodiqMiddleware(skip_delay=30),
    ]

    # Get RabbitMQ URL from environment variables for cloud deployments (e.g., Railway)
    rabbitmq_url = os.getenv('RABBITMQ_URL', "amqp://hTr960Qev0Mu4REA:ZOcf-ScmY54iyj7EFPSaysGddT-i-2WW@gondola.proxy.rlwy.net:32418")

    if rabbitmq_url:
        logger.info(f"Connecting to RabbitMQ using URL...")
        
        # The manual parsing logic from your snippet is a good safeguard for special characters in passwords.
        if '@' in rabbitmq_url and '://' in rabbitmq_url:
            try:
                credentials, server = rabbitmq_url.split('@', 1)
                protocol, credentials_part = credentials.split('://', 1)
                if ':' in credentials_part:
                    username, password = credentials_part.split(':', 1)
                    password = urllib.parse.unquote(password)
                    hostname, port = server.split(':', 1) if ':' in server else (server, '5672')
                    rabbitmq_url = f"{protocol}://{username}:{urllib.parse.quote(password, safe='')}@{hostname}:{port}"
                    logger.info("Reconstructed RabbitMQ URL with properly encoded password.")
            except ValueError:
                logger.warning("Could not parse and reconstruct RabbitMQ URL. Using original URL.")

        rabbitmq_broker = RabbitmqBroker(url=rabbitmq_url, middleware=middleware)
        logger.info("Successfully created RabbitMQ broker with URL.")
    else:
        # Fall back to host/port configuration for local Docker development
        rabbitmq_host = os.getenv('RABBITMQ_HOST', 'rabbitmq')
        rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
        logger.info(f"Connecting to RabbitMQ using host/port: {rabbitmq_host}:{rabbitmq_port}")
        rabbitmq_broker = RabbitmqBroker(host=rabbitmq_host, port=rabbitmq_port, middleware=middleware)
        logger.info("Successfully created RabbitMQ broker with host/port.")

except Exception as e:
    logger.error(f"Error setting up RabbitMQ connection: {e}", exc_info=True)
    # Fallback to a default local RabbitMQ instance as a last resort
    logger.info("Falling back to local RabbitMQ instance at localhost:5672")
    middleware = [dramatiq.middleware.AsyncIO(), PeriodiqMiddleware(skip_delay=30)]
    rabbitmq_broker = RabbitmqBroker(host='localhost', port=5672, middleware=middleware)

dramatiq.set_broker(rabbitmq_broker)
# --- END OF UPDATED LOGIC ---


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
if __name__ == "__main__":
    print("This module is intended to be run with: periodiq -v scheduler_worker")
    print("It will register periodic actors and run scheduled tasks.")
