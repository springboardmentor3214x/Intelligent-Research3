import React, { useState } from "react";
import { Briefcase, Plus, Edit2, Trash2, Calendar, Building2, UserCheck } from "lucide-react";
import Modal from "../common/Modal";

export default function ResearchHistoryTab({
  history = [],
  onAddHistory,
  onUpdateHistory,
  onDeleteHistory,
  onToast
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    position: "",
    organization: "",
    role: "Lead Researcher",
    startDate: "",
    endDate: "",
    current: false,
    description: ""
  });
  const [errors, setErrors] = useState({});

  function openAddModal() {
    setEditingItem(null);
    setForm({
      position: "",
      organization: "",
      role: "Principal Investigator",
      startDate: "",
      endDate: "",
      current: true,
      description: ""
    });
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({
      position: item.position || "",
      organization: item.organization || "",
      role: item.role || "Lead Researcher",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      current: Boolean(item.current),
      description: item.description || ""
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!form.position.trim()) errs.position = "Position title is required";
    if (!form.organization.trim()) errs.organization = "Organization is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        ...form,
        endDate: form.current ? null : form.endDate
      };
      if (editingItem) {
        await onUpdateHistory(editingItem.id, payload);
        onToast("✓ Research experience updated successfully", "success");
      } else {
        await onAddHistory(payload);
        onToast("✓ Research experience added successfully", "success");
      }
      setModalOpen(false);
    } catch (err) {
      onToast("Failed to save research history record", "error");
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}" from your research history?`)) return;
    try {
      await onDeleteHistory(id);
      onToast("✓ Research history record deleted", "info");
    } catch (err) {
      onToast("Failed to delete record", "error");
    }
  }

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">Research Experience & Academic Career History</h3>
          <p className="tab-section-desc">
            Chronicle professional appointments, faculty roles, fellowship tenures, and grant leadership positions.
          </p>
        </div>
        <button
          type="button"
          className="btn-action-primary"
          onClick={openAddModal}
        >
          <Plus size={16} />
          <span>Add Position</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state-panel">
          <Briefcase size={40} className="empty-state-icon" />
          <h4 className="empty-state-title">No Career History Added Yet</h4>
          <p className="empty-state-text">
            Add past and current research roles to demonstrate leadership experience for grant eligibility.
          </p>
          <button
            type="button"
            className="btn-action-primary"
            onClick={openAddModal}
          >
            <Plus size={16} /> Add First Position
          </button>
        </div>
      ) : (
        <div className="timeline-container">
          {history.map((item, idx) => (
            <div key={item.id} className="timeline-card">
              <div className="timeline-indicator-dot" />

              <div className="timeline-card-header">
                <div>
                  <h4 className="timeline-position-title">{item.position}</h4>
                  <div className="timeline-meta-row">
                    <span className="timeline-org">
                      <Building2 size={14} /> {item.organization}
                    </span>
                    <span className="timeline-role-badge">
                      <UserCheck size={13} /> {item.role}
                    </span>
                    <span className="timeline-date-range">
                      <Calendar size={13} /> {item.startDate} — {item.current ? "Present" : item.endDate || "Ended"}
                    </span>
                  </div>
                </div>

                <div className="timeline-actions">
                  <button
                    type="button"
                    className="btn-icon-ghost"
                    onClick={() => openEditModal(item)}
                    title="Edit record"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => handleDelete(item.id, item.position)}
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="timeline-description">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal for History ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Research Position" : "Add Research Appointment"}
        subtitle="Provide appointment title, organization, and project duties."
      >
        <form onSubmit={handleSubmit}>
          <div className="form-fields-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group-item full-width-field">
              <label className="form-field-label">
                Position / Designation <span className="req-star">*</span>
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                className={`form-input-field ${errors.position ? "input-err" : ""}`}
                placeholder="e.g. Senior Research Scientist"
                autoFocus
              />
              {errors.position && <span className="field-err-msg">{errors.position}</span>}
            </div>

            <div className="form-group-item full-width-field">
              <label className="form-field-label">
                Organization / Institution <span className="req-star">*</span>
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                className={`form-input-field ${errors.organization ? "input-err" : ""}`}
                placeholder="e.g. National Institute of Advanced Computing"
              />
              {errors.organization && <span className="field-err-msg">{errors.organization}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Research Role</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="form-input-field"
                placeholder="e.g. Principal Investigator"
              />
            </div>

            <div className="form-group-item">
              <label className="form-field-label">
                Start Date <span className="req-star">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className={`form-input-field ${errors.startDate ? "input-err" : ""}`}
              />
              {errors.startDate && <span className="field-err-msg">{errors.startDate}</span>}
            </div>

            <div className="form-group-item full-width-field">
              <label className="checkbox-row-label">
                <input
                  type="checkbox"
                  checked={form.current}
                  onChange={(e) => setForm((p) => ({ ...p, current: e.target.checked }))}
                />
                <span>I currently work in this research role</span>
              </label>
            </div>

            {!form.current && (
              <div className="form-group-item">
                <label className="form-field-label">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="form-input-field"
                />
              </div>
            )}

            <div className="form-group-item full-width-field">
              <label className="form-field-label">Key Responsibilities & Grants Managed</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="form-textarea-field"
                placeholder="Describe key research accomplishments, grants managed, and lab operations..."
              />
            </div>
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-action-primary"
            >
              {editingItem ? "Save Changes" : "Add Position"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}