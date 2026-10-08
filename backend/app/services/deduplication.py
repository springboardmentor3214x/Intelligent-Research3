"""
Module 10: Deduplication & Idempotency Service
Generates deterministic hashes and prevents duplicate notifications across repeated synchronizations.
"""
import hashlib
import json
from typing import Any, Dict

class DeduplicationEngine:
    @staticmethod
    def generate_idempotency_key(user_id: str, source_event_id: str, notification_type: str, related_record_id: str = "") -> str:
        """
        Creates a deterministic unique key: user_id:source_event_id:type:record_id
        """
        raw_key = f"{user_id}:{source_event_id}:{notification_type}:{related_record_id}"
        return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

    @staticmethod
    def generate_content_hash(user_id: str, title: str, category: str, record_id: str = "") -> str:
        """
        Creates a semantic hash for preventing near-duplicate rapid alerts
        """
        raw_str = f"{user_id}:{category}:{title.strip().lower()}:{record_id}"
        return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()
