"""
Module 10: Platform Event Bus
Decoupled event dispatcher allowing modules (3, 4, 5, 6, 8, 11) to publish events without direct coupling.
Ready to scale to Redis / Kafka / Celery.
"""
from typing import Callable, List, Dict, Any
import asyncio
import logging

logger = logging.getLogger("event_bus")

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._all_subscribers: List[Callable] = []

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def subscribe_all(self, handler: Callable):
        self._all_subscribers.append(handler)

    async def publish(self, event_type: str, event_data: Dict[str, Any]):
        logger.info(f"[EventBus] Emitting event: {event_type} - entity: {event_data.get('entity_id')}")
        handlers = self._subscribers.get(event_type, []) + self._all_subscribers
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event_type, event_data)
                else:
                    handler(event_type, event_data)
            except Exception as e:
                logger.error(f"[EventBus] Error executing subscriber {handler.__name__}: {str(e)}")

# Global Singleton Event Bus instance
platform_event_bus = EventBus()
