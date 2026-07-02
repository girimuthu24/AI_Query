"""
memory_store.py

In-memory dictionary that temporarily stores DataFrames keyed by a unique
session_id. This avoids persisting potentially large data to the database or
filesystem. Entries can optionally be expired based on creation time.
"""

from typing import Optional
from uuid import uuid4
from datetime import datetime, timedelta
import pandas as pd


# Global in-memory store.
# Structure: { session_id: { "df": DataFrame, "created_at": datetime } }
_store: dict[str, dict] = {}

# Default time-to-live for stored sessions (in minutes).
DEFAULT_TTL_MINUTES: int = 60


def generate_session_id() -> str:
    """Return a new, unique session identifier."""
    return uuid4().hex


def store_dataframe(df: pd.DataFrame, ttl_minutes: Optional[int] = None) -> str:
    """
    Store a DataFrame in memory and return the associated session_id.

    Parameters:
        df (pd.DataFrame): The DataFrame to store.
        ttl_minutes (int, optional): Time-to-live in minutes.
                                     Defaults to DEFAULT_TTL_MINUTES.

    Returns:
        str: A unique session_id that can be used to retrieve the DataFrame later.
    """
    session_id = generate_session_id()
    _store[session_id] = {
        "df": df,
        "created_at": datetime.utcnow(),
        "ttl_minutes": ttl_minutes or DEFAULT_TTL_MINUTES,
    }
    return session_id


def get_dataframe(session_id: str) -> Optional[pd.DataFrame]:
    """
    Retrieve a DataFrame by session_id.

    Returns None if the session does not exist or has expired.
    Expired entries are automatically cleaned up on access.
    """
    entry = _store.get(session_id)
    if entry is None:
        return None

    age = datetime.utcnow() - entry["created_at"]
    if age > timedelta(minutes=entry["ttl_minutes"]):
        # Session expired — remove it and return None.
        del _store[session_id]
        return None

    return entry["df"]


def remove_session(session_id: str) -> bool:
    """
    Remove a session and its associated DataFrame from memory.

    Returns True if the session existed and was removed, False otherwise.
    """
    return _store.pop(session_id, None) is not None


def clear_expired() -> int:
    """
    Remove all expired sessions from the store.

    Returns the number of sessions that were cleaned up.
    """
    now = datetime.utcnow()
    expired_keys = [
        sid
        for sid, entry in _store.items()
        if now - entry["created_at"] > timedelta(minutes=entry["ttl_minutes"])
    ]
    for sid in expired_keys:
        del _store[sid]
    return len(expired_keys)