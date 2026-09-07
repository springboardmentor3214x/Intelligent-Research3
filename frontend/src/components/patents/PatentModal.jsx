import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

export default function PatentModal({ isOpen, onClose, onSave, editingPatent }) {
  const initialForm = {
    title: "",
    patentNumber: "",
    inventors: "",
    assignee: "National Institute of Advanced Computing",
    filingDate: "",
    grantDate: "",
    status: "Granted",
    classification: "",
    technologyDomain: "Artificial Intelligence",
    country: "India",
    citationCount: 0,
    patentUrl: "",
    description: ""
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const statuses = ["Granted", "Published", "Pending", "Filed", "Expired"];

  const techDomains = [
    "Artificial Intelligence",
    "Machine Learning & Neural Architectures",
    "Edge AI & IoT",
    "Natural Language Processing",
    "Computer Vision & Robotics",
    "Quantum Information Processing",
    "Biotechnology & Health Tech",
    "Renewable Energy & Power Systems",
    "Other"
  ];

  useEffect(() => {
    if (editingPatent) {
      setForm({
        ...editingPatent,
        inventors: Array.isArray(editingPatent.inventors)
          ? editingPatent.inventors.join(", ")
          : editingPatent.inventors || "",
        grantDate: editingPatent.grantDate || "",
        citationCount: editingPatent.citationCount || 0
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [editingPatent, isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Patent title is required";
    if (!form.patentNumber.trim()) errs.patentNumber = "Patent number is required";
    if (!form.inventors.trim()) errs.inventors = "Inventors are required";
    if (!form.filingDate) errs.filingDate = "Filing date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...form,
      grantDate: form.status === "Granted" ? form.grantDate : null,
      citationCount: Number(form.citationCount) || 0
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPatent ? "Edit Intellectual Property Record" : "Add Registered Patent"}
      subtitle="Enter registered patent, utility model, or provisional filing information."
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-fields-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="form-group-item full-width-field">
            <label className="form-field-label">
              Patent Title <span className="req-star">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={`form-input-field ${errors.title ? "input-err" : ""}`}
              placeholder="e.g. System and Method for Interpretable Neural Decision Verification"
              autoFocus
            />
            {errors.title && <span className="field-err-msg">{errors.title}</span>}
          </div>

          <div className="form-group-item">
            <label className="form-field-label">
              Patent Number / Application ID <span className="req-star">*</span>
            </label>
            <input
              type="text"
              name="patentNumber"
              value={form.patentNumber}
              onChange={handleChange}
              className={`form-input-field ${errors.patentNumber ? "input-err" : ""}`}
              placeholder="e.g. US-11948201-B2 or IN-202441019283"
            />
            {errors.patentNumber && <span className="field-err-msg">{errors.patentNumber}</span>}
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Patent Legal Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-select-field"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-item full-width-field">
            <label className="form-field-label">
              Inventors <span className="req-star">*</span> (comma-separated)
            </label>
            <input
              type="text"
              name="inventors"
              value={form.inventors}
              onChange={handleChange}
              className={`form-input-field ${errors.inventors ? "input-err" : ""}`}
              placeholder="e.g. Dr. Priya Sharma, Dr. Arvind Rao"
            />
            {errors.inventors && <span className="field-err-msg">{errors.inventors}</span>}
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Assignee / Owner Organization</label>
            <input
              type="text"
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              className="form-input-field"
              placeholder="e.g. National Institute of Advanced Computing"
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Jurisdiction / Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="form-input-field"
              placeholder="e.g. United States, India, European Union"
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">
              Filing Date <span className="req-star">*</span>
            </label>
            <input
              type="date"
              name="filingDate"
              value={form.filingDate || ""}
              onChange={handleChange}
              className={`form-input-field ${errors.filingDate ? "input-err" : ""}`}
            />
            {errors.filingDate && <span className="field-err-msg">{errors.filingDate}</span>}
          </div>

          {form.status === "Granted" && (
            <div className="form-group-item">
              <label className="form-field-label">Grant Date</label>
              <input
                type="date"
                name="grantDate"
                value={form.grantDate || ""}
                onChange={handleChange}
                className="form-input-field"
              />
            </div>
          )}

          <div className="form-group-item">
            <label className="form-field-label">IPC / CPC Classification</label>
            <input
              type="text"
              name="classification"
              value={form.classification || ""}
              onChange={handleChange}
              className="form-input-field"
              placeholder="e.g. G06N 3/08"
            />
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Technology Domain</label>
            <select
              name="technologyDomain"
              value={form.technologyDomain}
              onChange={handleChange}
              className="form-select-field"
            >
              {techDomains.map((td) => (
                <option key={td} value={td}>
                  {td}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-item">
            <label className="form-field-label">Forward Citations Count</label>
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
            <label className="form-field-label">Patent Web Link / Repository URL</label>
            <input
              type="url"
              name="patentUrl"
              value={form.patentUrl || ""}
              onChange={handleChange}
              className="form-input-field"
              placeholder="https://patents.google.com/patent/..."
            />
          </div>

          <div className="form-group-item full-width-field">
            <label className="form-field-label">Patent Claims & Novelty Summary</label>
            <textarea
              name="description"
              rows={3}
              value={form.description || ""}
              onChange={handleChange}
              className="form-textarea-field"
              placeholder="Technical summary of inventive step, claims, and commercial application..."
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
            {editingPatent ? "Save Changes" : "Add Patent"}
          </button>
        </div>
      </form>
    </Modal>
  );
}