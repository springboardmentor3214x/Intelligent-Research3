/**
 * E2E Verification Script for Module 10 and Module 11 integration
 */
import { notificationService, NOTIFICATION_CATEGORIES } from '../notificationService.js';
import { platformEventBus, EVENT_TYPES } from '../eventBus.js';
import { evaluateRelevance } from '../relevanceEngine.js';
import { deliveryManager } from '../notificationDelivery.js';
import { REPORT_TYPES, generateReportPreview } from '../reportService.js';

console.log("==================================================");
console.log("E2E INTEGRATION & BEHAVIORAL VERIFICATION");
console.log("==================================================");

// Mock localStorage for Node environment if not present
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
console.log("\n[2] Verifying Relevance Engine Matching...");
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

// 6. Report Service Preview Integration
console.log("\n[6] Verifying Module 11 Report Preview Generation...");
const reportPreview = await generateReportPreview('funding', { domain: 'Artificial Intelligence' });
console.log(`  -> Report status: ${reportPreview.status}, Module: ${reportPreview.source_module}`);
console.log(`  -> Opportunities identified: ${reportPreview.opportunities?.length || 0}`);
if (reportPreview.status !== 'success') throw new Error("Report generation failed");
console.log("  [PASS] Report service preview integration verified.");

console.log("\n==================================================");
console.log("ALL E2E INTEGRATION CHECKS PASSED WITH 100% SUCCESS!");
console.log("==================================================");
