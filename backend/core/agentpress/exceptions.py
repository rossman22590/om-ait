"""
Custom exceptions for AgentPress.
"""


class ThreadDeletedException(Exception):
    """Raised when a thread has been deleted during agent execution."""
    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        super().__init__(f"Thread {thread_id} was deleted during execution")
