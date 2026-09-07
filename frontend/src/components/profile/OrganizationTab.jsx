import React, { useState, useEffect } from "react";
import { Building2, Globe, MapPin, FlaskConical, Edit2, Check, X } from "lucide-react";

export default function OrganizationTab({ profile, onSave, onToast }) {
  const initial = profile?.organization || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile?.organization) {
      setForm(profile.organization);
    }
  }, [profile]);

  const orgTypes = [
    "University",
    "Research Institute",
    "Corporate R&D",
    "Government Research Organization",
    "Startup",
    "Innovation Center",
    "Other"
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
    if (!form.name || !form.name.trim()) {
      errs.name = "Organization Name is required";
    }
    if (!form.department || !form.department.trim()) {
      errs.department = "Department is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave("organization", form);
      setEditing(false);
      onToast("✓ Organization details updated successfully", "success");
    } catch (err) {
      onToast("Failed to update organization details", "error");
    }
  }

  function handleCancel() {
    setForm(initial);
    setErrors({});
    setEditing(false);
  }

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">Institutional Affiliation</h3>
          <p className="tab-section-desc">
            Define your primary academic institution, enterprise R&D lab, and departmental affiliation.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => setEditing(true)}
          >
            <Edit2 size={15} />
            <span>Edit Organization</span>
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card-panel">
          <h4 className="form-card-title">Primary Institution Details</h4>
          <div className="form-fields-grid">
            <div className="form-group-item">
              <label className="form-field-label">
                Organization Name <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  className={`form-input-field ${errors.name ? "input-err" : ""}`}
                  placeholder="e.g. Indian Institute of Technology"
                />
              ) : (
                <p className="read-only-val font-semibold">{form.name || "—"}</p>
              )}
              {errors.name && <span className="field-err-msg">{errors.name}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Organization Type</label>
              {editing ? (
                <select
                  name="type"
                  value={form.type || "Research Institute"}
                  onChange={handleChange}
                  className="form-select-field"
                >
                  {orgTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="read-only-val">{form.type || "Research Institute"}</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">
                Department / School <span className="req-star">*</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  name="department"
                  value={form.department || ""}
                  onChange={handleChange}
                  className={`form-input-field ${errors.department ? "input-err" : ""}`}
                  placeholder="e.g. Computer Science and Engineering"
                />
              ) : (
                <p className="read-only-val">{form.department || "—"}</p>
              )}
              {errors.department && <span className="field-err-msg">{errors.department}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Research Center / Laboratory</label>
              {editing ? (
                <input
                  type="text"
                  name="laboratory"
                  value={form.laboratory || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="e.g. AI & Cognitive Computing Lab"
                />
              ) : (
                <p className="read-only-val">{form.laboratory || "—"}</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Organization Website</label>
              {editing ? (
                <input
                  type="url"
                  name="website"
                  value={form.website || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="https://..."
                />
              ) : form.website ? (
                <a
                  href={form.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="read-only-val read-only-url"
                >
                  {form.website} ↗
                </a>
              ) : (
                <p className="read-only-val">—</p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Country</label>
              {editing ? (
                <input
                  type="text"
                  name="country"
                  value={form.country || ""}
                  onChange={handleChange}
                  className="form-input-field"
                  placeholder="e.g. India"
                />
              ) : (
                <p className="read-only-val">{form.country || "—"}</p>
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

          <div className="form-group-item full-width-field" style={{ marginTop: "16px" }}>
            <label className="form-field-label">Organization Overview / Description</label>
            {editing ? (
              <textarea
                name="description"
                rows={3}
                value={form.description || ""}
                onChange={handleChange}
                className="form-textarea-field"
                placeholder="Brief description of the research institution and its primary mission..."
              />
            ) : (
              <p className="read-only-val read-only-multiline">
                {form.description || "No institutional description provided."}
              </p>
            )}
          </div>
        </div>

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