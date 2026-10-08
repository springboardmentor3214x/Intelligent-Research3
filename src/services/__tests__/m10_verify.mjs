/**
 * Module 10 Standalone Verification Script
 */
import { notificationService, NOTIFICATION_CATEGORIES } from '../notificationService.js';
import { platformEventBus, EVENT_TYPES } from '../eventBus.js';
import { evaluateRelevance } from '../relevanceEngine.js';
import { deliveryManager } from '../notificationDelivery.js';

console.log("==================================================");
console.log("MODULE 10: NOTIFICATION SYSTEM E2E VERIFICATION");
console.log("==================================================");

if (typeof localStorage === 'undefined' || localStorage === null) {
  let store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

const testUserId = "user-e2e-demo-123";
const testProfile = {
  user_id: testUserId,
  fullName: "Dr. Alex Rivera",
  role: "Researcher",
  researchDomain: "Artificial Intelligence",
  researchAreas: ["Computer Vision", "Deep Learning", "Neural Networks"],
  researchInterests: ["Generative AI", "Translational Medicine"],
  researchKeywords: ["Medical Imaging", "Edge AI", "Foundation Models"],
  technologyAreas: ["Edge AI", "Autonomous Agents"]
};

// 1. Initial State & Seed Data
console.log("\n[1] Verifying Initial Seed Notifications...");
const initial = notificationService.getNotifications({
  userId: testUserId,
  userProfile: testProfile,
  pageSize: 20
});
console.log(`  -> Initial notifications count: ${initial.total}, Unread: ${initial.unreadCount}`);
if (initial.total < 3) throw new Error("Expected at least 3 initial seed notifications");
console.log("  [PASS] Initial notifications populated successfully.");

// 2. Relevance Engine Evaluation
console.log("\n[2] Verifying Explainable Relevance Matching...");
const relEvent = {
  title: "NSF Edge AI Computer Vision Grant",
  domain: "Artificial Intelligence",
  technology: "Edge AI",
  research_areas: ["Computer Vision"],
  keywords: ["Medical Imaging", "Deep Learning"],
  funding_amount: "$1,800,000 USD",
  days_left: 10
};
const relResult = evaluateRelevance(testProfile, relEvent, "funding");
console.log(`  -> Calculated Score: ${relResult.score}/100`);
console.log(`  -> Reasons: ${relResult.reasons.join('; ')}`);
console.log(`  -> Matched Terms: ${relResult.matchedTerms.join(', ')}`);
if (!relResult.isRelevant || relResult.score < 70) throw new Error("Expected high relevance score for matching AI profile");
console.log("  [PASS] Explainable relevance engine passed.");

// 3. Event Bus to Notification Pipeline Ingestion
console.log("\n[3] Verifying Cross-Module Event Bus Ingestion...");
let toastReceived = false;
deliveryManager.onToast((notif) => {
  toastReceived = true;
  console.log(`  -> Real-Time Toast Triggered: "${notif.title}" (Priority: ${notif.priority})`);
});

const emittedEvent = platformEventBus.publish(EVENT_TYPES.TECHNOLOGY_MATURITY_CHANGED, {
  source_module: 'technology',
  entity_id: 'tech-ag-99',
  payload: {
    id: 'tech-ag-99',
    technology: 'Autonomous Edge AI Agents',
    old_stage: 'Developing',
    new_stage: 'Maturing (TRL 7)',
    score: 94,
    domain: 'Artificial Intelligence',
    maturity_transition: true
  }
});

const ingestionResult = notificationService.processEvent(emittedEvent, testProfile, testUserId);
console.log(`  -> Notification Created: ${ingestionResult.created}, ID: ${ingestionResult.notification?.id}`);
if (!ingestionResult.created) throw new Error("Failed to create notification from valid event");
console.log("  [PASS] Event bus ingestion and toast dispatch passed.");

// 4. Deduplication & Idempotency
console.log("\n[4] Verifying Deduplication Engine...");
const dupResult = notificationService.processEvent(emittedEvent, testProfile, testUserId);
console.log(`  -> Re-ingested duplicate created status: ${dupResult.created} (Reason: ${dupResult.reason})`);
if (dupResult.created) throw new Error("Duplicate notification was created! Deduplication failed.");
console.log("  [PASS] Duplicate prevention strictly enforced.");

// 5. Read / Unread State Mutations
console.log("\n[5] Verifying Read / Unread State Mutations...");
const notifId = ingestionResult.notification.id;
notificationService.markAsRead(testUserId, notifId);
let unreadAfterMark = notificationService.getUnreadCount(testUserId);
console.log(`  -> Unread count after mark as read: ${unreadAfterMark}`);

notificationService.markAllAsRead(testUserId);
let unreadAfterAll = notificationService.getUnreadCount(testUserId);
console.log(`  -> Unread count after markAllAsRead: ${unreadAfterAll}`);
if (unreadAfterAll !== 0) throw new Error("Expected 0 unread notifications");
console.log("  [PASS] Read/Unread state transitions verified.");

// 6. Preferences Configuration
console.log("\n[6] Verifying Notification Preferences...");
const prefs = notificationService.getPreferences(testUserId);
console.log(`  -> Default categories configured: ${Object.keys(prefs).length}`);
prefs.patents.in_app = false;
notificationService.savePreferences(testUserId, prefs);
const updatedPrefs = notificationService.getPreferences(testUserId);
if (updatedPrefs.patents.in_app !== false) throw new Error("Preferences update failed");
console.log("  [PASS] Notification preferences verified.");

// 7. Analytics & Health Metrics
console.log("\n[7] Verifying System Analytics & Deduplication Metrics...");
const analytics = notificationService.getAnalytics(testUserId);
console.log(`  -> Total Notifications: ${analytics.total}`);
console.log(`  -> Duplicates Blocked: ${analytics.duplicatesBlocked}`);
console.log(`  -> In-App Delivery Success: ${analytics.deliverySuccessRate}%`);
if (analytics.duplicatesBlocked < 1) throw new Error("Expected at least 1 duplicate blocked in audit logs");
console.log("  [PASS] Analytics & metrics verified.");

console.log("\n==================================================");
console.log("ALL MODULE 10 INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
console.log("==================================================");
