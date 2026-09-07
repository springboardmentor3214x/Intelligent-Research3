import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

export default function PublicationModal({ isOpen, onClose, onSave, editingPublication }) {
  const initialForm = {
    title: "",
    authors: "",
    journal: "",
    type: "Journal",
    publicationDate: "",
    doi: "",
    url: "",
    researchDomain: "Artificial Intelligence",
    keywords: "",
    citationCount: 0,
    abstract: ""
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const publicationTypes = [
    "Journal",
    "Conference",
    "Book Chapter",
    "Workshop",
    "Preprint",
    "Technical Report"
  ];

  const domains = [
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Robotics",
    "Data Science",
    "Cybersecurity",
    "Quantum Computing",
    "Biomedical Engineering",
    "Other"
  ];

  useEffect(() => {
    if (editingPublication) {
      setForm({
        ...editingPublication,
        authors: Array.isArray(editingPublication.authors)
          ? editingPublication.authors.join(", ")
          : editingPublication.authors || "",
        citationCount: editingPublication.citationCount || 0
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [editingPublication, isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Publication title is required";
    if (!form.authors.trim()) errs.authors = "Authors are required";
    if (!form.journal.trim()) errs.journal = "Journal or conference name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...form,
      citationCount: Number(form.citationCount) || 0
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPublication ? "Edit Publication Record" : "Add Publication"}
      subtitle="Enter academic paper, conference proceeding or journal details."
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-fields-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="form-group-item full-width-field">
            <label className="form-field-label">
              Publication Title <span className="req-star">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={`form-input-field ${errors.title ? "input-err" : ""}`}
              placeholder="e.g. Interpretable Deep Learning Frameworks for High-Stakes Clinical Diagnostics"
              autoFocus
            />
            {errors.title && <span className="field-err-msg">{errors.title}</span>}
          </div>

          <div className="form-group-item full-width-field">
            <label className="form-field-label">
              Authors <span className="req-star">*</span> (comma-separated)
            </label>
            <input
              type="text"
              name="authors"
              value={form.authors}
              onChange={handleChange}
              className={`form-input-field ${errors.authors ? "input-err" : ""}`}
              placeholder="e.g. Dr. Priya Sharma, Marcus Vance, Dr. Arvind Rao"
            />
            {errors.authors && <span className="field-err-msg">{errors.authors}</span>}
          </div>

          <div className="form-group-item">
            <label className="form-field-label">
              Journal / Conference Venue <span className="req-star">*</span>
            </label>
            <input
              type="text"
              name="journal"
              value={form.journal}
              onChange={handleChange}
              className={`form-input-field ${errors.journal ? "input-err" : ""}`}
              placeholder="e.g. IEEE TPAMI, NeurIPS 2024"
            />
            {errors.journal && <span className="field-err-msg">{errors.journal}</span>}
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Publication Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="form-select-field"
            >
              {publicationTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Publication Date</label>
            <input
              type="date"
              name="publicationDate"
              value={form.publicationDate || ""}
              onChange={handleChange}
              className="form-input-field"
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Citation Count</label>
            <input
              type="number"
              name="citationCount"
              min="0"
              value={form.citationCount}
              onChange={handleChange}
              className="form-input-field"
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Digital Object Identifier (DOI)</label>
            <input
              type="text"
              name="doi"
              value={form.doi || ""}
              onChange={handleChange}
              className="form-input-field"
              placeholder="10.1109/TPAMI.2025.1092831"
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Paper Web Link / URL</label>
            <input
              type="url"
              name="url"
              value={form.url || ""}
              onChange={handleChange}
              className="form-input-field"
              placeholder="https://doi.org/..."
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Research Domain</label>
            <select
              name="researchDomain"
              value={form.researchDomain}
              onChange={handleChange}
              className="form-select-field"
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Keywords</label>
            <input
              type="text"
              name="keywords"
              value={form.keywords || ""}
              onChange={handleChange}
              className="form-input-field"
              placeholder="e.g. Deep Learning, Explainable AI"
            />
          </div>

          <div className="form-group-item full-width-field">
            <label className="form-field-label">Abstract / Summary</label>
            <textarea
              name="abstract"
              rows={4}
              value={form.abstract || ""}
              onChange={handleChange}
              className="form-textarea-field"
              placeholder="Brief summary of hypotheses, methodologies, and core findings..."
            />
          </div>
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="btn-action-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-action-primary"
          >
            {editingPublication ? "Save Changes" : "Add Publication"}
          </button>
        </div>
      </form>
    </Modal>
  );
}