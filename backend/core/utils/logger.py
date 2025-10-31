import structlog, logging, os

ENV_MODE = os.getenv("ENV_MODE", "LOCAL")

# Determine desired log level from env (prefer LOGGING_LEVEL, then LOG_LEVEL),
# fallback to INFO by default in all environments
level_name = (
    os.getenv("LOGGING_LEVEL")
    or os.getenv("LOG_LEVEL")
    or ("INFO" if ENV_MODE.upper() in {"PRODUCTION", "STAGING", "LOCAL"} else "INFO")
)

LOGGING_LEVEL = logging.getLevelNamesMapping().get(level_name.upper(), logging.INFO)

renderer = [structlog.processors.JSONRenderer()]
if ENV_MODE.lower() == "local".lower() or ENV_MODE.lower() == "staging".lower():
    renderer = [structlog.dev.ConsoleRenderer(colors=True)]

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.dict_tracebacks,
        structlog.processors.CallsiteParameterAdder(
            {
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.LINENO,
            }
        ),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.contextvars.merge_contextvars,
        *renderer,
    ],
    cache_logger_on_first_use=True,
    wrapper_class=structlog.make_filtering_bound_logger(LOGGING_LEVEL),
)

logger: structlog.stdlib.BoundLogger = structlog.get_logger()
