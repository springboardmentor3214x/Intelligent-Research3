/**
 * MODULE 10: PLATFORM EVENT BUS
 * Decoupled event dispatcher supporting Modules 3, 4, 5, 6, 8, 11, and Platform.
 * Extensible for WebSocket, Server-Sent Events, or Redis Streams.
 */

export const EVENT_TYPES = {
  // Module 4: Funding
  FUNDING_OPPORTUNITY_CREATED: 'FUNDING_OPPORTUNITY_CREATED',
  FUNDING_DEADLINE_APPROACHING: 'FUNDING_DEADLINE_APPROACHING',
  
  // Module 5: Patents
  PATENT_CREATED: 'PATENT_CREATED',
  PATENT_ACTIVITY_DETECTED: 'PATENT_ACTIVITY_DETECTED',
  PATENT_CLUSTER_DETECTED: 'PATENT_CLUSTER_DETECTED',

  // Module 6: Technology
  TECHNOLOGY_EMERGING: 'TECHNOLOGY_EMERGING',
  TECHNOLOGY_MATURITY_CHANGED: 'TECHNOLOGY_MATURITY_CHANGED',
  TECHNOLOGY_OPPORTUNITY_FOUND: 'TECHNOLOGY_OPPORTUNITY_FOUND',

  // Module 3: Research
  RESEARCH_TREND_CHANGED: 'RESEARCH_TREND_CHANGED',
  RESEARCH_HOTSPOT_DETECTED: 'RESEARCH_HOTSPOT_DETECTED',
  HIGH_IMPACT_PAPER_PUBLISHED: 'HIGH_IMPACT_PAPER_PUBLISHED',

  // Module 8: Commercialization
  COMMERCIALIZATION_OPPORTUNITY_FOUND: 'COMMERCIALIZATION_OPPORTUNITY_FOUND',
  LICENSING_OPPORTUNITY_DETECTED: 'LICENSING_OPPORTUNITY_DETECTED',
  PARTNERSHIP_OPPORTUNITY_DETECTED: 'PARTNERSHIP_OPPORTUNITY_DETECTED',

  // Module 11: Reports
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_FAILED: 'REPORT_FAILED',

  // Platform & System
  PROFILE_COMPLETED: 'PROFILE_COMPLETED',
  SECURITY_EVENT: 'SECURITY_EVENT',
  PLATFORM_UPDATE: 'PLATFORM_UPDATE',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT'
};

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistory = 100;
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscription function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to all platform events
   */
  subscribeAll(callback) {
    return this.subscribe('*', callback);
  }

  /**
   * Publish a platform event
   */
  publish(eventType, eventData) {
    const timestamp = new Date().toISOString();
    const normalizedEvent = {
      event_id: eventData.event_id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      event_type: eventType,
      source_module: eventData.source_module || 'platform',
      entity_type: eventData.entity_type || 'generic',
      entity_id: String(eventData.entity_id || ''),
      event_version: eventData.event_version || '1.0',
      occurred_at: eventData.occurred_at || timestamp,
      payload: eventData.payload || eventData,
      correlation_id: eventData.correlation_id || `corr-${Date.now()}`
    };

    // Store in history
    this.eventHistory.unshift(normalizedEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Notify specific subscribers
    const specificListeners = this.listeners.get(eventType);
    if (specificListeners) {
      specificListeners.forEach((callback) => {
        try {
          callback(normalizedEvent);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, err);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((callback) => {
        try {
          callback(normalizedEvent);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard listener for ${eventType}:`, err);
        }
      });
    }

    return normalizedEvent;
  }

  /**
   * Retrieve recent event history for audit
   */
  getHistory() {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }
}

// Global Singleton Event Bus instance
export const platformEventBus = new EventBus();
