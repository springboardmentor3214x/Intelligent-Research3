import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Building2, Globe, Briefcase, BookOpen, Tag,
  FlaskConical, CheckCircle2, Save, ArrowRight, Sparkles, X
} from 'lucide-react';

const ROLES = [
  'Researcher', 'Startup Founder', 'Innovation Manager',
  'University', 'Enterprise', 'Investor', 'Administrator',
];

const DOMAINS = [
  'Artificial Intelligence & Machine Learning',
  'Biotechnology & Life Sciences',
  'Clean Energy & Environment',
  'Cybersecurity & Data Privacy',
  'Healthcare & Medical Research',
  'Materials Science & Engineering',
  'Quantum Computing',
  'Robotics & Automation',
  'Social Sciences & Humanities',
  'Space & Aerospace Technology',
];

const SUGGESTED_AREAS = {
  'Artificial Intelligence & Machine Learning': ['Machine Learning', 'Deep Learning', 'Computer Vision', 'Natural Language Processing', 'Generative AI', 'Reinforcement Learning'],
  'Biotechnology & Life Sciences': ['Genomics', 'Drug Discovery', 'CRISPR', 'Protein Folding', 'Bioinformatics', 'Synthetic Biology'],
  'Clean Energy & Environment': ['Solar Energy', 'Energy Storage', 'Carbon Capture', 'Smart Grid', 'Wind Power', 'Hydrogen Fuel'],
  'Cybersecurity & Data Privacy': ['Zero Trust Security', 'Cryptography', 'Threat Detection', 'Privacy Computing', 'Blockchain Security'],
  'Healthcare & Medical Research': ['Medical Imaging', 'Clinical Trials', 'Precision Medicine', 'Telemedicine', 'Wearable Health'],
  'Materials Science & Engineering': ['Nanomaterials', 'Composite Materials', 'Semiconductor Devices', 'Biomaterials', 'Photovoltaics'],
  'Quantum Computing': ['Quantum Algorithms', 'Error Correction', 'Quantum Cryptography', 'Quantum Hardware', 'Quantum Simulation'],
  'Robotics & Automation': ['Autonomous Systems', 'Human-Robot Interaction', 'Swarm Robotics', 'Industrial Automation', 'Soft Robotics'],
  'Social Sciences & Humanities': ['Behavioral Economics', 'Digital Humanities', 'Political Science', 'Psychology', 'Education Technology'],
  'Space & Aerospace Technology': ['Satellite Systems', 'Propulsion Systems', 'Space Mining', 'Mars Mission', 'CubeSat Technology'],
};

export default function ProfileSetupPage({ onComplete, isModal = false }) {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    role: profile?.role || '',
    organization: profile?.organization || '',
    designation: profile?.designation || '',
    country: profile?.country || '',
    researchDomain: profile?.researchDomain || '',
    researchAreas: profile?.researchAreas || [],
    researchKeywords: profile?.researchKeywords || [],
    technologyAreas: profile?.technologyAreas || [],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const suggestedAreas = SUGGESTED_AREAS[form.researchDomain] || [];

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Name required';
    if (!form.role) e.role = 'Please select a role';
    if (!form.researchDomain) e.researchDomain = 'Please select your primary domain';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleArea = (area) => {
    setForm(prev => ({
      ...prev,
      researchAreas: prev.researchAreas.includes(area)
        ? prev.researchAreas.filter(a => a !== area)
        : [...prev.researchAreas, area],
    }));
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !form.researchKeywords.includes(kw)) {
      setForm(prev => ({ ...prev, researchKeywords: [...prev.researchKeywords, kw] }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw) => {
    setForm(prev => ({ ...prev, researchKeywords: prev.researchKeywords.filter(k => k !== kw) }));
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await updateProfile({ ...form, isProfileComplete: true });
      setSaved(true);
      setTimeout(() => {
        if (onComplete) onComplete();
        else navigate('/research');
      }, 900);
    } finally {
      setSaving(false);
    }
  };

  const completionScore = [
    form.fullName, form.role, form.organization, form.researchDomain,
    form.researchAreas.length > 0, form.researchKeywords.length > 0,
  ].filter(Boolean).length;

  const pct = Math.round((completionScore / 6) * 100);

  return (
    <div style={{
      background: isModal ? 'rgba(15,39,68,0.55)' : 'var(--ri-bg-main)',
      position: isModal ? 'fixed' : 'relative',
      inset: isModal ? 0 : 'auto',
      zIndex: isModal ? 200 : 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isModal ? '24px' : '0',
      backdropFilter: isModal ? 'blur(4px)' : 'none',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 720,
        maxHeight: isModal ? '90vh' : 'none',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(15,39,68,0.18)',
        border: '1px solid var(--ri-border-subtle)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--ri-navy-primary) 0%, var(--ri-blue-accent) 100%)',
          padding: '28px 32px',
          borderRadius: '16px 16px 0 0',
          color: '#fff',
          position: 'relative',
        }}>
          {isModal && (
            <button onClick={onComplete} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={18} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20 }}>
                Module 2 — Research Profile
              </div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                Complete your profile to personalize research intelligence
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
              <span>Profile Completion</span>
              <span style={{ fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 6 }}>
              <div style={{
                height: 6, borderRadius: 99,
                background: pct === 100 ? '#10B981' : '#fff',
                width: `${pct}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          {/* Row 1: Name + Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <User size={12} style={{ marginRight: 5 }} />Full Name *
              </label>
              <input
                className="form-input"
                placeholder="Dr. Jane Smith"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {errors.fullName && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.fullName}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Briefcase size={12} style={{ marginRight: 5 }} />Role *
              </label>
              <select
                className="form-select"
                value={form.role}
                onChange={e => handleChange('role', e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Select your role</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.role}</span>}
            </div>
          </div>

          {/* Row 2: Organization + Designation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Building2 size={12} style={{ marginRight: 5 }} />Organization
              </label>
              <input
                className="form-input"
                placeholder="MIT / TechStartup Inc."
                value={form.organization}
                onChange={e => handleChange('organization', e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Globe size={12} style={{ marginRight: 5 }} />Country
              </label>
              <input
                className="form-input"
                placeholder="India / USA / UK"
                value={form.country}
                onChange={e => handleChange('country', e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Primary Research Domain */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FlaskConical size={12} style={{ marginRight: 5 }} />Primary Research Domain *
            </label>
            <select
              className="form-select"
              value={form.researchDomain}
              onChange={e => { handleChange('researchDomain', e.target.value); handleChange('researchAreas', []); }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">Select your primary research domain</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.researchDomain && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.researchDomain}</span>}
          </div>

          {/* Research Sub-areas */}
          {suggestedAreas.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <BookOpen size={12} style={{ marginRight: 5 }} />Research Sub-areas (select all that apply)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestedAreas.map(area => {
                  const selected = form.researchAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 99,
                        border: `1.5px solid ${selected ? 'var(--ri-blue-accent)' : 'var(--ri-border-subtle)'}`,
                        background: selected ? 'var(--ri-blue-light)' : '#fff',
                        color: selected ? 'var(--ri-blue-accent)' : 'var(--ri-text-secondary)',
                        fontSize: 13,
                        fontWeight: selected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      {selected && <CheckCircle2 size={12} />}
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Research Keywords */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Tag size={12} style={{ marginRight: 5 }} />Research Keywords
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-input"
                placeholder="e.g. Transformers, LLM, Vision Transformers"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addKeyword}
                className="btn-submit"
                style={{ padding: '10px 18px', width: 'auto', whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
            {form.researchKeywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.researchKeywords.map(kw => (
                  <span key={kw} style={{
                    background: 'var(--ri-blue-light)',
                    color: 'var(--ri-blue-accent)',
                    border: '1px solid var(--ri-border-accent)',
                    borderRadius: 99, padding: '4px 12px',
                    fontSize: 12.5, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {kw}
                    <button
                      onClick={() => removeKeyword(kw)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--ri-border-subtle)', paddingTop: 20 }}>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontSize: 13.5, fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Profile saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="btn-submit"
              style={{
                width: 'auto', padding: '11px 28px',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <Sparkles size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving Profile...
                </>
              ) : saved ? (
                <><CheckCircle2 size={16} /> Saved — Launching Dashboard</>
              ) : (
                <><Save size={16} /> Save Profile & Continue <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
