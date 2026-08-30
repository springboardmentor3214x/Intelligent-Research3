import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Globe, MapPin, Award, Check, X, Edit2 } from "lucide-react";

export default function BasicInformationTab({ profile, onSave, onToast }) {
  const initial = profile?.personalInfo || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile?.personalInfo) {
      setForm(profile.personalInfo);
    }
  }, [profile]);

  const researcherTypes = [
    "Researcher",
    "Academic Researcher",
    "Industry Researcher",
    "Postdoctoral Researcher",
    "PhD Scholar",
    "Principal Investigator"
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.fullName || !form.fullName.trim()) {
      errs.fullName = "Full Name is required";
    }
    if (!form.email || !form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!form.designation || !form.designation.trim()) {
      errs.designation = "Designation is required";
    }
    if (!form.country || !form.country.trim()) {
      errs.country = "Country is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave("personalInfo", {
        ...form,
        experienceYears: Number(form.experienceYears) || 0
      });
      setEditing(false);
      onToast("✓ Basic Information updated successfully", "success");
    } catch (err) {
      onToast("Failed to update basic information", "error");
    }
  }

  function handleCancel() {
    setForm(profile?.personalInfo || {});
    setErrors({});
    setEditing(false);
  }

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">Personal & Professional Information</h3>
          <p className="tab-section-desc">
            Manage your verified academic profile, contact credentials, and researcher classification.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => setEditing(true)}
          >
            <Edit2 size={15} />
            <span>Edit Information</span>
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal Information */}
        <div className="form-card-panel">
          <h4 className="form-card-title">Personal Information</h4>
          <div className="form-fields-grid">
            <div className="form-group-item">
              <label className="form-field-label">
                Full Name <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName || ""}
                  onChange={handleChange}
                  className={`form-input-field ${errors.fullName ? "input-err" : ""}`}
                  placeholder="e.g. Dr. Priya Sharma"
                />
              ) : (
                <p className="read-only-val">{form.fullName || "—"}</p>
              )}
              {errors.fullName && <span className="field-err-msg">{errors.fullName}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">
                Researcher ID <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  name="researcherId"
                  value={profile?.id || "RES-10234"}
                  disabled
                  className="form-input-field input-disabled"
                />
              ) : (
                <p className="read-only-val">{profile?.id || "RES-10234"}</p>
              )}
              <small className="field-hint">Unique institutional identification key</small>
            </div>

            <div className="form-group-item">
              <label className="form-field-label">
                Email Address <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  className={`form-input-field ${errors.email ? "input-err" : ""}`}
                  placeholder="e.g. researcher@institution.edu"
                />
              ) : (
                <p className="read-only-val">{form.email || "—"}</p>
              )}
              {errors.email && <span className="field-err-msg">{errors.email}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Phone Number</label>
              {editing ? (
                <input
                  type="text"
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="+91 98765 43210"
                />
              ) : (
                <p className="read-only-val">{form.phone || "—"}</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">
                Country <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  name="country"
                  value={form.country || ""}
                  onChange={handleChange}
                  className={`form-input-field ${errors.country ? "input-err" : ""}`}
                  placeholder="e.g. India"
                />
              ) : (
                <p className="read-only-val">{form.country || "—"}</p>
              )}
              {errors.country && <span className="field-err-msg">{errors.country}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">State / Province</label>
              {editing ? (
                <input
                  type="text"
                  name="state"
                  value={form.state || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="e.g. Karnataka"
                />
              ) : (
                <p className="read-only-val">{form.state || "—"}</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">City</label>
              {editing ? (
                <input
                  type="text"
                  name="city"
                  value={form.city || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="e.g. Bengaluru"
                />
              ) : (
                <p className="read-only-val">{form.city || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Professional Information */}
        <div className="form-card-panel">
          <h4 className="form-card-title">Professional Information</h4>
          <div className="form-fields-grid">
            <div className="form-group-item">
              <label className="form-field-label">
                Current Designation <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  name="designation"
                  value={form.designation || ""}
                  onChange={handleChange}
                  className={`form-input-field ${errors.designation ? "input-err" : ""}`}
                  placeholder="e.g. Senior AI Researcher"
                />
              ) : (
                <p className="read-only-val">{form.designation || "—"}</p>
              )}
              {errors.designation && <span className="field-err-msg">{errors.designation}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Academic Qualification</label>
              {editing ? (
                <input
                  type="text"
                  name="qualification"
                  value={form.qualification || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="e.g. Ph.D. in Computer Science"
                />
              ) : (
                <p className="read-only-val">{form.qualification || "—"}</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Years of Research Experience</label>
              {editing ? (
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  max="60"
                  value={form.experienceYears ?? 0}
                  onChange={handleChange}
                  className="form-input-field"
                />
              ) : (
                <p className="read-only-val">{form.experienceYears ?? 0} Years</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Researcher Classification Type</label>
              {editing ? (
                <select
                  name="researcherType"
                  value={form.researcherType || "Academic Researcher"}
                  onChange={handleChange}
                  className="form-select-field"
                >
                  {researcherTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="read-only-val">{form.researcherType || "Academic Researcher"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {editing && (
          <div className="form-action-footer">
            <button
              type="button"
              className="btn-action-secondary"
              onClick={handleCancel}
            >
              <X size={15} /> Cancel
            </button>
            <button
              type="submit"
              className="btn-action-primary"
            >
              <Check size={15} /> Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}