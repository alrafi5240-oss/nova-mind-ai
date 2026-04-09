"""File-based backup and persistence for memory storage."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from src.storage.memory import MemoryStorage

logger = logging.getLogger(__name__)


class FileBackupStorage:
    """File-based backup layer on top of memory storage."""

    def __init__(self, memory_storage: MemoryStorage, backup_dir: str = "./data"):
        """Initialize file backup storage.

        Args:
            memory_storage: MemoryStorage instance to backup
            backup_dir: Directory for backup files
        """
        self.memory = memory_storage
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    @property
    def backup_file(self) -> Path:
        """Get path to backup file."""
        return self.backup_dir / "saas_data.json"

    async def save_backup(self) -> bool:
        """Save current memory state to file.

        Returns:
            True if successful
        """
        try:
            data = self.memory._get_all_data()

            # Add metadata
            backup_data = {
                "version": "1.0",
                "timestamp": datetime.utcnow().isoformat(),
                "data": data,
            }

            # Write to file
            with open(self.backup_file, "w") as f:
                json.dump(backup_data, f, indent=2, default=str)

            logger.info(f"Saved backup to {self.backup_file} ({len(data)} items)")
            return True

        except Exception as e:
            logger.error(f"Failed to save backup: {e}")
            return False

    async def load_backup(self) -> bool:
        """Load data from backup file into memory.

        Returns:
            True if successful, False if file not found
        """
        if not self.backup_file.exists():
            logger.info(f"No backup file found at {self.backup_file}")
            return False

        try:
            with open(self.backup_file, "r") as f:
                backup_data = json.load(f)

            data = backup_data.get("data", {})
            self.memory._restore_data(data)

            timestamp = backup_data.get("timestamp", "unknown")
            logger.info(f"Loaded backup from {self.backup_file} ({len(data)} items, timestamp: {timestamp})")
            return True

        except Exception as e:
            logger.error(f"Failed to load backup: {e}")
            return False

    async def create_checkpoint(self, checkpoint_name: str = "") -> bool:
        """Create a timestamped checkpoint of current data.

        Args:
            checkpoint_name: Optional name for checkpoint

        Returns:
            True if successful
        """
        try:
            if not checkpoint_name:
                checkpoint_name = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

            checkpoint_file = self.backup_dir / f"checkpoint_{checkpoint_name}.json"

            data = self.memory._get_all_data()

            checkpoint_data = {
                "version": "1.0",
                "timestamp": datetime.utcnow().isoformat(),
                "name": checkpoint_name,
                "data": data,
            }

            with open(checkpoint_file, "w") as f:
                json.dump(checkpoint_data, f, indent=2, default=str)

            logger.info(f"Created checkpoint: {checkpoint_file}")
            return True

        except Exception as e:
            logger.error(f"Failed to create checkpoint: {e}")
            return False

    async def restore_checkpoint(self, checkpoint_name: str) -> bool:
        """Restore data from a checkpoint.

        Args:
            checkpoint_name: Name of checkpoint to restore

        Returns:
            True if successful
        """
        try:
            checkpoint_file = self.backup_dir / f"checkpoint_{checkpoint_name}.json"

            if not checkpoint_file.exists():
                logger.error(f"Checkpoint not found: {checkpoint_file}")
                return False

            with open(checkpoint_file, "r") as f:
                checkpoint_data = json.load(f)

            data = checkpoint_data.get("data", {})
            self.memory._restore_data(data)

            logger.info(f"Restored from checkpoint: {checkpoint_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to restore checkpoint: {e}")
            return False

    async def list_checkpoints(self) -> list[dict[str, Any]]:
        """List all available checkpoints.

        Returns:
            List of checkpoint info dicts
        """
        checkpoints = []

        for checkpoint_file in sorted(self.backup_dir.glob("checkpoint_*.json")):
            try:
                with open(checkpoint_file, "r") as f:
                    data = json.load(f)

                checkpoints.append({
                    "name": data.get("name", "unknown"),
                    "timestamp": data.get("timestamp", "unknown"),
                    "file": checkpoint_file.name,
                    "size": checkpoint_file.stat().st_size,
                })
            except Exception as e:
                logger.warning(f"Failed to read checkpoint {checkpoint_file}: {e}")

        return checkpoints

    async def cleanup_old_checkpoints(self, keep_count: int = 10) -> int:
        """Delete old checkpoints, keeping only the most recent.

        Args:
            keep_count: Number of recent checkpoints to keep

        Returns:
            Number of checkpoints deleted
        """
        checkpoint_files = sorted(
            self.backup_dir.glob("checkpoint_*.json"),
            key=lambda f: f.stat().st_mtime,
            reverse=True,
        )

        deleted_count = 0

        for checkpoint_file in checkpoint_files[keep_count:]:
            try:
                checkpoint_file.unlink()
                deleted_count += 1
            except Exception as e:
                logger.warning(f"Failed to delete checkpoint {checkpoint_file}: {e}")

        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old checkpoints")

        return deleted_count
