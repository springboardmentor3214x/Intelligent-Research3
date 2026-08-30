import React, { useState } from "react";
import { Cpu, Plus, Edit2, Trash2, Check, X, Award, Clock, Layers } from "lucide-react";
import Modal from "../common/Modal";

export default function TechnologyManager({
  technologies = [],
  onAddTechnology,
  onUpdateTechnology,
  onDeleteTechnology,
  onToast
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "AI & ML",
    proficiency: "Advanced",
    experienceYears: 4
  });
  const [errors, setErrors] = useState({});

  const categories = [
    "AI & ML",
    "Software & Distributed Systems",
    "Emerging Technologies",
    "Data & Cloud Infrastructure",
    "Hardware & Edge Computing",
    "Other"
  ];

  const proficiencies = ["Beginner", "Intermediate", "Advanced", "Expert"];

  function openAddModal() {
    setEditingTech(null);
    setForm({
      name: "",
      category: "AI & ML",
      proficiency: "Advanced",
      experienceYears: 4
    });
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(tech) {
    setEditingTech(tech);
    setForm({
      name: tech.name,
      category: tech.category || "AI & ML",
      proficiency: tech.proficiency || "Intermediate",
      experienceYears: tech.experienceYears || 1
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!form.name || !form.name.trim()) {
      errs.name = "Technology name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingTech) {
        await onUpdateTechnology(editingTech.id, {
          ...form,
          experienceYears: Number(form.experienceYears) || 0
        });
        onToast("✓ Technology updated successfully", "success");
      } else {
        await onAddTechnology({
          ...form,
          experienceYears: Number(form.experienceYears) || 0
        });
        onToast("✓ Technology added successfully", "success");
      }
      setModalOpen(false);
    } catch (err) {
      onToast("Failed to save technology", "error");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove technology "${name}" from your profile?`)) return;
    try {
      await onDeleteTechnology(id);
      onToast("✓ Technology removed", "info");
    } catch (err) {
      onToast("Failed to delete technology", "error");
    }
  }

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">Technology Competencies & Stacks</h3>
          <p className="tab-section-desc">
            Document framework proficiencies, programming platforms, and specialized computational systems.
          </p>
        </div>
        <button
          type="button"
          className="btn-action-primary"
          onClick={openAddModal}
        >
          <Plus size={16} />
          <span>Add Technology</span>
        </button>
      </div>

      {technologies.length === 0 ? (
        <div className="empty-state-panel">
          <Cpu size={40} className="empty-state-icon" />
          <h4 className="empty-state-title">No Technologies Added Yet</h4>
          <p className="empty-state-text">
            Add your programming languages, machine learning frameworks, and software tools to highlight your technical expertise.
          </p>
          <button
            type="button"
            className="btn-action-primary"
            onClick={openAddModal}
          >
            <Plus size={16} /> Add First Technology
          </button>
        </div>
      ) : (
        <div className="tech-cards-grid">
          {technologies.map((tech) => (
            <div key={tech.id} className="tech-item-card">
              <div className="tech-card-top">
                <div className="tech-name-box">
                  <Cpu size={16} className="tech-icon-cyan" />
                  <h4 className="tech-card-title">{tech.name}</h4>
                </div>
                <div className="tech-card-actions">
                  <button
                    type="button"
                    className="btn-icon-ghost"
                    onClick={() => openEditModal(tech)}
                    title="Edit technology"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => handleDelete(tech.id, tech.name)}
                    title="Delete technology"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <span className="tech-category-pill">{tech.category || "AI & ML"}</span>

              <div className="tech-details-row">
                <div className="tech-detail-item">
                  <Award size={14} className="detail-icon" />
                  <span className={`badge-proficiency prof-${(tech.proficiency || "intermediate").toLowerCase()}`}>
                    {tech.proficiency}
                  </span>
                </div>
                <div className="tech-detail-item">
                  <Clock size={14} className="detail-icon" />
                  <span className="tech-exp-text">{tech.experienceYears || 1} Years Exp</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal for Add / Edit ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTech ? "Edit Technology Skill" : "Add Technology Competency"}
        subtitle="Specify framework, library, programming language or platform details."
        maxWidth="540px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-fields-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="form-group-item">
              <label className="form-field-label">
                Technology / Framework Name <span className="req-star">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={`form-input-field ${errors.name ? "input-err" : ""}`}
                placeholder="e.g. PyTorch, Kubernetes, CUDA, React"
                autoFocus
              />
              {errors.name && <span className="field-err-msg">{errors.name}</span>}
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Technology Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="form-select-field"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Proficiency Level</label>
              <select
                value={form.proficiency}
                onChange={(e) => setForm((p) => ({ ...p, proficiency: e.target.value }))}
                className="form-select-field"
              >
                {proficiencies.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-item">
              <label className="form-field-label">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.experienceYears}
                onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))}
                className="form-input-field"
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
              {editingTech ? "Save Changes" : "Add Technology"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}