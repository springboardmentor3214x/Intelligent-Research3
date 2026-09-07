import React from "react";
import { CheckCircle, Circle, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import "./ProfileCompletion.css";

export default function ProfileCompletion({ completion, onNavigateTab }) {
  if (!completion) return null;

  const { percentage, checklist, recommendations } = completion;

  return (
    <div className="completion-card">
      <div className="completion-card-header">
        <div>
          <h3 className="completion-title">
            <ShieldCheck size={18} className="shield-icon" /> Profile Strength & Completeness
          </h3>
          <p className="completion-desc">
            A complete profile improves funding discovery accuracy and collaborative intelligence matching.
          </p>
        </div>
        <div className="completion-badge-huge">
          <span className="completion-percentage">{percentage}%</span>
          <span className="completion-rating">
            {percentage >= 90 ? "Excellent" : percentage >= 75 ? "Strong" : percentage >= 50 ? "Moderate" : "Incomplete"}
          </span>
        </div>
      </div>

      <div className="completion-progress-track">
        <div
          className="completion-progress-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="completion-sections-grid">
        <div className="completion-checklist-box">
          <h4 className="box-title">Module Status</h4>
          <div className="checklist-items">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`checklist-item ${item.completed ? "item-done" : "item-pending"}`}
                onClick={() => onNavigateTab(item.tab)}
                role="button"
                tabIndex={0}
              >
                {item.completed ? (
                  <CheckCircle size={15} className="check-done" />
                ) : (
                  <Circle size={15} className="check-pending" />
                )}
                <span className="checklist-label">{item.label}</span>
                <span className="checklist-weight">+{item.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="completion-recommendations-box">
          <h4 className="box-title">Actionable Recommendations</h4>
          {recommendations.length === 0 ? (
            <div className="completion-perfect-state">
              <CheckCircle size={28} className="perfect-icon" />
              <p>Your research profile is fully complete and ready for funding intelligence engines!</p>
            </div>
          ) : (
            <div className="recommendations-list">
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  className="rec-action-button"
                  onClick={() => onNavigateTab(rec.tab)}
                >
                  <span className="rec-text">{rec.text}</span>
                  <ArrowRight size={14} className="rec-arrow" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}