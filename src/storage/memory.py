"""In-memory storage backend with thread safety."""

from __future__ import annotations

import logging
from collections import defaultdict
from threading import Lock
from typing import Any, Optional

logger = logging.getLogger(__name__)


class MemoryStorage:
    """Thread-safe in-memory storage backend."""

    def __init__(self):
        """Initialize memory storage."""
        self._data: dict[str, dict[str, Any]] = defaultdict(dict)
        self._locks: dict[str, Lock] = defaultdict(Lock)
        self._global_lock = Lock()

    async def save(self, key: str, data: dict[str, Any]) -> None:
        """Save data with thread safety.

        Args:
            key: Storage key (e.g., "users:user_id:email@example.com")
            data: Data to save (must be serializable)
        """
        with self._global_lock:
            self._data[key] = data.copy()
            logger.debug(f"Saved data to key: {key}")

    async def load(self, key: str) -> Optional[dict[str, Any]]:
        """Load data by key.

        Args:
            key: Storage key

        Returns:
            Data dict or None if not found
        """
        with self._global_lock:
            if key in self._data:
                logger.debug(f"Loaded data from key: {key}")
                return self._data[key].copy()
        return None

    async def delete(self, key: str) -> bool:
        """Delete data by key.

        Args:
            key: Storage key

        Returns:
            True if deleted, False if not found
        """
        with self._global_lock:
            if key in self._data:
                del self._data[key]
                logger.debug(f"Deleted data from key: {key}")
                return True
        return False

    async def exists(self, key: str) -> bool:
        """Check if key exists.

        Args:
            key: Storage key

        Returns:
            True if exists, False otherwise
        """
        with self._global_lock:
            return key in self._data

    async def list(self, prefix: str = "") -> list[dict[str, Any]]:
        """List all data matching prefix.

        Args:
            prefix: Key prefix to filter by (e.g., "users:")

        Returns:
            List of data dicts matching prefix
        """
        with self._global_lock:
            results = []
            for key, data in self._data.items():
                if not prefix or key.startswith(prefix):
                    results.append(data.copy())
            logger.debug(f"Listed {len(results)} items with prefix: {prefix}")
            return results

    async def clear_prefix(self, prefix: str) -> int:
        """Delete all items with prefix.

        Args:
            prefix: Key prefix to delete

        Returns:
            Number of items deleted
        """
        with self._global_lock:
            keys_to_delete = [k for k in self._data.keys() if k.startswith(prefix)]
            for key in keys_to_delete:
                del self._data[key]
            logger.debug(f"Cleared {len(keys_to_delete)} items with prefix: {prefix}")
            return len(keys_to_delete)

    async def clear_all(self) -> None:
        """Clear all data."""
        with self._global_lock:
            count = len(self._data)
            self._data.clear()
            logger.debug(f"Cleared all data ({count} items)")

    async def get_stats(self) -> dict[str, Any]:
        """Get storage statistics.

        Returns:
            Dict with storage stats
        """
        with self._global_lock:
            return {
                "total_keys": len(self._data),
                "total_items": sum(len(v) if isinstance(v, dict) else 1 for v in self._data.values()),
            }

    def _get_all_data(self) -> dict[str, dict[str, Any]]:
        """Get all data for backup/export.

        Returns:
            Complete data dict
        """
        with self._global_lock:
            return {k: v.copy() for k, v in self._data.items()}

    def _restore_data(self, data: dict[str, dict[str, Any]]) -> None:
        """Restore data from backup/import.

        Args:
            data: Data dict to restore
        """
        with self._global_lock:
            self._data.clear()
            self._data.update(data)
            logger.debug(f"Restored {len(data)} items from backup")
