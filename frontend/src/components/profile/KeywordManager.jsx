import React, { useState, useEffect } from "react";
import { Tag, Plus, X, Sparkles, Check, Info } from "lucide-react";

export default function KeywordManager({ profile, onSaveKeywords, onToast }) {
  const currentKeywords = profile?.keywords || [];
  const [keywords, setKeywords] = useState(currentKeywords);
  const [inputVal, setInputVal] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile?.keywords) {
      setKeywords(profile.keywords);
      setDirty(false);
    }
  }, [profile]);

  const MAX_KEYWORDS = 20;

  const popularKeywords = [
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "Explainable AI",
    "Computer Vision",
    "Natural Language Processing",
    "Generative AI",
    "Reinforcement Learning",
    "Edge AI",
    "Quantum Computing",
    "Robotics",
    "Cybersecurity",
    "Internet of Things",
    "Biomedical Imaging",
    "Knowledge Graphs",
    "Optimization"
  ];

  function handleAdd(kw) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    if (keywords.length >= MAX_KEYWORDS) {
      onToast(`Maximum of ${MAX_KEYWORDS} keywords reached`, "info");
      return;
    }
    if (keywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setInputVal("");
      return;
    }
    const updated = [...keywords, trimmed];
    setKeywords(updated);
    setInputVal("");
    setDirty(true);
  }

  function handleRemove(kwToRemove) {
    const updated = keywords.filter((k) => k !== kwToRemove);
    setKeywords(updated);
    setDirty(true);
  }

  async function handleSave() {
    try {
      await onSaveKeywords(keywords);
      setDirty(false);
      onToast("✓ Research keywords saved successfully", "success");
    } catch (err) {
      onToast("Failed to save research keywords", "error");
    }
  }

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">Research Keyword Intelligence</h3>
          <p className="tab-section-desc">
            Manage technical keywords that calibrate semantic similarity for Funding Discovery, Trend Analysis, and Patent Mapping.
          </p>
        </div>
        <div className="keyword-count-pill">
          <Tag size={15} />
          <span>
            {keywords.length} / {MAX_KEYWORDS} keywords
          </span>
        </div>
      </div>

      <div className="intelligence-info-callout">
        <Info size={18} className="info-callout-icon" />
        <p>
          <strong>Cross-Module Matching:</strong> Your keywords are indexed by Module 3 (Funding Opportunities Discovery), Module 4 (Research Trends), and Module 5 (Patent Landscape Analysis) for high-precision grants and patent prior-art mapping.
        </p>
      </div>

      <div className="form-card-panel">
        <div className="keyword-input-wrapper">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd(inputVal);
              }
            }}
            placeholder="Type a research keyword and press Enter (e.g. Neural Architecture Search)..."
            className="form-input-field"
            disabled={keywords.length >= MAX_KEYWORDS}
          />
          <button
            type="button"
            className="btn-action-primary"
            onClick={() => handleAdd(inputVal)}
            disabled={!inputVal.trim() || keywords.length >= MAX_KEYWORDS}
          >
            <Plus size={16} /> Add Keyword
          </button>
        </div>

        <div className="active-keywords-shelf">
          <h4 className="shelf-title">Active Indexed Keywords ({keywords.length})</h4>
          {keywords.length === 0 ? (
            <p className="empty-inline">No keywords added yet. Add at least 5 keywords to improve intelligence scoring.</p>
          ) : (
            <div className="chips-container">
              {keywords.map((kw) => (
                <span key={kw} className="chip-item chip-removable chip-keyword">
                  <Tag size={13} className="chip-tag-icon" />
                  <span>{kw}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => handleRemove(kw)}
                    aria-label={`Remove keyword ${kw}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="suggested-keywords-box">
          <span className="suggested-label">
            <Sparkles size={14} className="sparkle-icon" /> Recommended Technical Keywords:
          </span>
          <div className="suggested-chips-wrap">
            {popularKeywords
              .filter((pk) => !keywords.includes(pk))
              .map((rec) => (
                <button
                  key={rec}
                  type="button"
                  className="chip-suggestion"
                  onClick={() => handleAdd(rec)}
                  disabled={keywords.length >= MAX_KEYWORDS}
                >
                  + {rec}
                </button>
              ))}
          </div>
        </div>
      </div>

      {dirty && (
        <div className="form-action-footer">
          <button
            type="button"
            className="btn-action-primary"
            onClick={handleSave}
          >
            <Check size={15} /> Save Keyword Updates
          </button>
        </div>
      )}
    </div>
  );
}