import React, { useState, useEffect } from "react";
import { Sparkles, Layers, Edit2, Check, X, Plus } from "lucide-react";

export default function ResearchInformationTab({ profile, onSave, onToast }) {
  const initial = profile?.research || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    primaryDomain: initial.primaryDomain || "Artificial Intelligence",
    researchAreas: initial.researchAreas || [],
    interests: initial.interests || "",
    summary: initial.summary || ""
  });
  const [newAreaInput, setNewAreaInput] = useState("");

  useEffect(() => {
    if (profile?.research) {
      setForm({
        primaryDomain: profile.research.primaryDomain || "Artificial Intelligence",
        researchAreas: profile.research.researchAreas || [],
        interests: profile.research.interests || "",
        summary: profile.research.summary || ""
      });
    }
  }, [profile]);

  const domains = [
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Robotics & Autonomous Systems",
    "Data Science & Predictive Analytics",
    "Cybersecurity & Privacy",
    "Internet of Things (IoT)",
    "Cloud & Distributed Computing",
    "Quantum Computing",
    "Biomedical Engineering & Healthcare AI",
    "Renewable Energy & Clean Tech",
    "Other"
  ];

  const suggestedAreas = [
    "Machine Learning",
    "Deep Learning",
    "Explainable AI",
    "Predictive Analytics",
    "Computer Vision",
    "Natural Language Processing",
    "Reinforcement Learning",
    "Neural Architecture Search",
    "Edge Intelligence",
    "Multimodal Systems"
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddArea(area) {
    const trimmed = area.trim();
    if (!trimmed) return;
    if (form.researchAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setNewAreaInput("");
      return;
    }
    setForm((prev) => ({
      ...prev,
      researchAreas: [...prev.researchAreas, trimmed]
    }));
    setNewAreaInput("");
  }

  function handleRemoveArea(areaToRemove) {
    setForm((prev) => ({
      ...prev,
      researchAreas: prev.researchAreas.filter((a) => a !== areaToRemove)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await onSave("research", form);
      setEditing(false);
      onToast("✓ Research Information updated successfully", "success");
    } catch (err) {
      onToast("Failed to update research information", "error");
    }
  }

  function handleCancel() {
    setForm({
      primaryDomain: initial.primaryDomain || "Artificial Intelligence",
      researchAreas: initial.researchAreas || [],
      interests: initial.interests || "",
      summary: initial.summary || ""
    });
    setEditing(false);
  }

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">Research Focus & Scientific Scope</h3>
          <p className="tab-section-desc">
            Define your primary research domain, specialized investigation areas, and scholarly summary.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => setEditing(true)}
          >
            <Edit2 size={15} />
            <span>Edit Research Focus</span>
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card-panel">
          <h4 className="form-card-title">Core Domain & Specializations</h4>

          <div className="form-fields-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="form-group-item">
              <label className="form-field-label">
                Primary Research Domain <span className="req-star">*</span>
              </label>
              {editing ? (
                <select
                  name="primaryDomain"
                  value={form.primaryDomain}
                  onChange={handleChange}
                  className="form-select-field"
                >
                  {domains.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="domain-pill">{form.primaryDomain}</span>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Specialized Research Areas</label>
              <div className="chips-container">
                {form.researchAreas.map((area) => (
                  <span key={area} className="chip-item chip-removable">
                    {area}
                    {editing && (
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => handleRemoveArea(area)}
                        aria-label={`Remove ${area}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {editing && (
                <div className="add-chip-row">
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddArea(newAreaInput);
                      }
                    }}
                    placeholder="Type custom research area and press Enter..."
                    className="form-input-field"
                    style={{ maxWidth: "420px" }}
                  />
                  <button
                    type="button"
                    className="btn-action-secondary btn-sm"
                    onClick={() => handleAddArea(newAreaInput)}
                  >
                    <Plus size={14} /> Add Area
                  </button>
                </div>
              )}

              {editing && (
                <div className="suggested-chips-wrap">
                  <span className="suggested-label">Quick Add Suggestions:</span>
                  {suggestedAreas
                    .filter((s) => !form.researchAreas.includes(s))
                    .slice(0, 6)
                    .map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        className="chip-suggestion"
                        onClick={() => handleAddArea(sug)}
                      >
                        + {sug}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-card-panel">
          <h4 className="form-card-title">Interests & Career Summary</h4>

          <div className="form-fields-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="form-group-item">
              <label className="form-field-label">
                Research Interests & Technical Statement <span className="req-star">*</span>
              </label>
              {editing ? (
                <textarea
                  name="interests"
                  rows={3}
                  value={form.interests || ""}
                  onChange={handleChange}
                  className="form-textarea-field"
                  placeholder="e.g. Explainable AI, intelligent systems, healthcare diagnostics, robust optimization..."
                />
              ) : (
                <p className="read-only-val read-only-multiline">
                  {form.interests || "No research interests specified."}
                </p>
              )}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">
                Executive Research Summary <span className="req-star">*</span>
              </label>
              {editing ? (
                <textarea
                  name="summary"
                  rows={4}
                  value={form.summary || ""}
                  onChange={handleChange}
                  className="form-textarea-field"
                  placeholder="Provide a comprehensive summary of your scholarly career, milestones, and investigative vision..."
                />
              ) : (
                <p className="read-only-val read-only-multiline">
                  {form.summary || "No executive summary provided."}
                </p>
              )}
            </div>
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