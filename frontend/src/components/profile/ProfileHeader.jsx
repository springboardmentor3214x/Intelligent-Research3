import React from "react";
import {
  Building2,
  MapPin,
  IdCard,
  Edit3,
  Sparkles,
  GraduationCap
} from "lucide-react";
import "./ProfileHeader.css";

export default function ProfileHeader({ profile, completion, onEditClick }) {
  if (!profile) return null;

  const personal = profile.personalInfo || {};
  const org = profile.organization || {};
  const research = profile.research || {};

  const initials = personal.fullName
    ? personal.fullName
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "RES";

  return (
    <div className="profile-header-card">
      <div className="profile-header-main">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-fallback">{initials}</div>
        </div>

        <div className="profile-identity-info">
          <div className="profile-title-row">
            <h2 className="profile-full-name">{personal.fullName || "Researcher"}</h2>
            <span className="profile-role-chip">{personal.researcherType || "Academic Researcher"}</span>
          </div>

          <p className="profile-designation">
            <GraduationCap size={15} />
            <span>{personal.designation || "Senior AI Researcher"}</span>
          </p>

          <div className="profile-meta-grid">
            <div className="profile-meta-item">
              <Building2 size={15} />
              <span>{org.name || "National Institute of Advanced Computing"}</span>
              {org.department && <small className="meta-dept">({org.department})</small>}
            </div>

            <div className="profile-meta-item">
              <MapPin size={15} />
              <span>
                {[personal.city, personal.country].filter(Boolean).join(", ") || "Bengaluru, India"}
              </span>
            </div>

            <div className="profile-meta-item">
              <IdCard size={15} />
              <span className="res-id-badge">{profile.id || "RES-10234"}</span>
            </div>
          </div>
        </div>

        <div className="profile-header-actions">
          <button
            type="button"
            className="btn-header-edit"
            onClick={onEditClick}
          >
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <div className="profile-header-bottom-bar">
        <div className="header-completion-mini">
          <div className="completion-mini-header">
            <span className="completion-mini-label">
              <Sparkles size={14} className="sparkle-icon" /> Profile Strength
            </span>
            <span className="completion-mini-val">{completion.percentage}%</span>
          </div>
          <div className="completion-mini-bar">
            <div
              className="completion-mini-fill"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
        </div>

        <div className="header-domain-tag">
          <span className="domain-label">Primary Research Domain:</span>
          <span className="domain-value">{research.primaryDomain || "Artificial Intelligence"}</span>
        </div>
      </div>
    </div>
  );
}