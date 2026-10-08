import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Building2, Globe, Briefcase, BookOpen, Tag, Cpu,
  ChevronRight, ChevronLeft, CheckCircle2, Sparkles, X,
  Plus, Trash2, FileText, Award, ArrowRight,
} from 'lucide-react';
import { addPublication, addUserPatent } from '../services/profileService';

/* ===================== Static Data ===================== */
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

const AREA_SUGGESTIONS = {
  'Artificial Intelligence & Machine Learning': ['Machine Learning', 'Deep Learning', 'Computer Vision', 'Natural Language Processing', 'Generative AI', 'Reinforcement Learning', 'Explainable AI', 'Federated Learning'],
  'Biotechnology & Life Sciences': ['Genomics', 'Drug Discovery', 'CRISPR', 'Protein Folding', 'Bioinformatics', 'Synthetic Biology', 'Metabolomics'],
  'Clean Energy & Environment': ['Solar Energy', 'Energy Storage', 'Carbon Capture', 'Smart Grid', 'Wind Power', 'Hydrogen Fuel', 'Sustainability'],
  'Cybersecurity & Data Privacy': ['Zero Trust Security', 'Cryptography', 'Threat Detection', 'Privacy Computing', 'Blockchain Security', 'Post-Quantum Crypto'],
  'Healthcare & Medical Research': ['Medical Imaging', 'Clinical Trials', 'Precision Medicine', 'Telemedicine', 'Wearable Health', 'Drug Delivery'],
  'Materials Science & Engineering': ['Nanomaterials', 'Composite Materials', 'Semiconductor Devices', 'Biomaterials', 'Photovoltaics', '2D Materials'],
  'Quantum Computing': ['Quantum Algorithms', 'Error Correction', 'Quantum Cryptography', 'Quantum Hardware', 'Quantum Simulation', 'Topological Qubits'],
  'Robotics & Automation': ['Autonomous Systems', 'Human-Robot Interaction', 'Swarm Robotics', 'Industrial Automation', 'Soft Robotics', 'Drone Technology'],
  'Social Sciences & Humanities': ['Behavioral Economics', 'Digital Humanities', 'Political Science', 'Psychology', 'Education Technology', 'Sociology'],
  'Space & Aerospace Technology': ['Satellite Systems', 'Propulsion Systems', 'Space Mining', 'Mars Mission', 'CubeSat Technology', 'Space Debris'],
};

const TECH_SUGGESTIONS = [
  'Python', 'TensorFlow', 'PyTorch', 'MATLAB', 'R',
  'CUDA / GPU Computing', 'Kubernetes', 'Docker', 'AWS/GCP/Azure',
  'React', 'Node.js', 'FastAPI', 'Rust', 'C++', 'Java',
  'FPGA / Embedded Systems', 'Quantum SDKs (Qiskit)', 'Bioinformatics Tools',
];

const PUB_TYPES = ['Journal Article', 'Conference Paper', 'Book Chapter', 'Preprint', 'Technical Report', 'Thesis', 'Patent', 'Review Article'];
const PATENT_STATUSES = ['Filed', 'Pending', 'Published', 'Granted', 'Expired', 'Abandoned'];

const STEPS = [
  { id: 1, label: 'Basic Info', icon: User },
  { id: 2, label: 'Research Domain', icon: BookOpen },
  { id: 3, label: 'Keywords & Tech', icon: Tag },
  { id: 4, label: 'Publications', icon: FileText },
  { id: 5, label: 'Patents', icon: Award },
  { id: 6, label: 'Complete', icon: CheckCircle2 },
];

/* ===================== Tag Pill ===================== */
function TagPill({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'var(--ri-blue-light, #EFF6FF)',
      color: 'var(--ri-blue-accent, #2563EB)',
      border: '1.5px solid var(--ri-border-accent, #93C5FD)',
      borderRadius: 99, padding: '4px 10px', fontSize: 12.5, fontWeight: 600,
    }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', lineHeight: 1 }}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}

/* ===================== Chip Toggle ===================== */
function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 99, cursor: 'pointer',
      border: `1.5px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
      background: selected ? '#EFF6FF' : '#fff',
      color: selected ? '#2563EB' : '#475569',
      fontSize: 13, fontWeight: selected ? 600 : 400,
      transition: 'all 0.15s ease',
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {selected && <CheckCircle2 size={12} />}
      {label}
    </button>
  );
}

/* ===================== MAIN COMPONENT ===================== */
export default function CompleteProfilePage() {
  const { user, profile, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Form State ──────────────────────────────────────────────────
  const [basic, setBasic] = useState({
    fullName: profile?.fullName || user?.user_metadata?.full_name || '',
    country: profile?.country || '',
    organization: profile?.organization || '',
    department: profile?.department || '',
    designation: profile?.designation || '',
  });

  const [research, setResearch] = useState({
    researchDomain: profile?.researchDomain || '',
    researchAreas: profile?.researchAreas || [],
    researchInterests: profile?.researchInterests || [],
  });

  const [kw, setKw] = useState({
    researchKeywords: profile?.researchKeywords || [],
    technologyAreas: profile?.technologyAreas || [],
    kwInput: '',
  });

  const [publications, setPublications] = useState(profile?.publications || []);
  const [pubForm, setPubForm] = useState({ title: '', authors: '', pub_date: '', journal: '', conference: '', pub_type: 'Journal Article', doi: '', url: '' });
  const [showPubForm, setShowPubForm] = useState(false);

  const [patents, setPatents] = useState(profile?.patents || []);
  const [patForm, setPatForm] = useState({ title: '', patent_number: '', inventor: '', filing_date: '', publication_date: '', status: 'Filed', domain: '', patent_url: '' });
  const [showPatForm, setShowPatForm] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────
  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setDirection('forward');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setErrors({});
    setDirection('back');
    setStep(s => s - 1);
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!basic.fullName.trim()) e.fullName = 'Full name is required';
    }
    if (s === 2) {
      if (!research.researchDomain) e.researchDomain = 'Please select your primary domain';
    }
    return e;
  };

  // ── Toggle helpers ──────────────────────────────────────────────
  const toggleArea = (area) => setResearch(r => ({
    ...r,
    researchAreas: r.researchAreas.includes(area)
      ? r.researchAreas.filter(a => a !== area)
      : [...r.researchAreas, area],
  }));

  const toggleInterest = (interest) => setResearch(r => ({
    ...r,
    researchInterests: r.researchInterests.includes(interest)
      ? r.researchInterests.filter(i => i !== interest)
      : [...r.researchInterests, interest],
  }));

  const toggleTech = (tech) => setKw(k => ({
    ...k,
    technologyAreas: k.technologyAreas.includes(tech)
      ? k.technologyAreas.filter(t => t !== tech)
      : [...k.technologyAreas, tech],
  }));

  const addKeyword = () => {
    const w = kw.kwInput.trim();
    if (w && !kw.researchKeywords.includes(w)) {
      setKw(k => ({ ...k, researchKeywords: [...k.researchKeywords, w], kwInput: '' }));
    } else {
      setKw(k => ({ ...k, kwInput: '' }));
    }
  };

  // ── Publications ─────────────────────────────────────────────────
  const addPub = () => {
    if (!pubForm.title.trim()) return;
    setPublications(p => [...p, { ...pubForm, id: Date.now(), authors: pubForm.authors.split(',').map(a => a.trim()).filter(Boolean) }]);
    setPubForm({ title: '', authors: '', pub_date: '', journal: '', conference: '', pub_type: 'Journal Article', doi: '', url: '' });
    setShowPubForm(false);
  };

  // ── Patents ────────────────────────────────────────────────────────
  const addPat = () => {
    if (!patForm.title.trim()) return;
    setPatents(p => [...p, { ...patForm, id: Date.now() }]);
    setPatForm({ title: '', patent_number: '', inventor: '', filing_date: '', publication_date: '', status: 'Filed', domain: '', patent_url: '' });
    setShowPatForm(false);
  };

  // ── Final Submit ────────────────────────────────────────────────
  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeProfile({
        ...basic,
        ...research,
        researchKeywords: kw.researchKeywords,
        technologyAreas: kw.technologyAreas,
        publications,
        patents,
        profile_completed: true,
      });

      if (user?.id) {
        for (const pub of publications) {
          await addPublication(user.id, pub).catch(() => {});
        }
        for (const pat of patents) {
          await addUserPatent(user.id, pat).catch(() => {});
        }
      }

      navigate('/research', { replace: true });
    } catch (e) {
      console.error('Profile save failed:', e);
      setSaving(false);
    }
  };

  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);
  const suggestedAreas = AREA_SUGGESTIONS[research.researchDomain] || [];

  // ── Input style helper ───────────────────────────────────────────
  const inputStyle = (err) => ({
    width: '100%', padding: '10px 13px',
    border: `1.5px solid ${err ? '#FCA5A5' : '#E2E8F0'}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: 'Inter, sans-serif',
    background: '#fff', color: '#0F172A', outline: 'none',
    transition: 'border 0.15s ease', boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 700,
    color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2744 0%, #1E3A5F 50%, #2563EB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Animated background dots */}
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }
        @keyframes fadeSlideBack { from { opacity:0; transform: translateX(-30px); } to { opacity:1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGreen { 0%,100% { transform: scale(1); opacity:1; } 50% { transform: scale(1.1); opacity:0.8; } }
        .step-slide { animation: fadeSlideIn 0.3s ease forwards; }
        .step-slide-back { animation: fadeSlideBack 0.3s ease forwards; }
      `}</style>

      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680,
        boxShadow: '0 30px 80px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2744, #2563EB)',
          padding: '28px 32px 20px', color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Complete Your Research Profile
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 1 }}>
                Help us personalize your funding, patent and research intelligence
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto 3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#10B981' : active ? '#fff' : 'rgba(255,255,255,0.2)',
                    color: done ? '#fff' : active ? '#2563EB' : 'rgba(255,255,255,0.6)',
                    fontSize: 12, fontWeight: 700,
                    transition: 'all 0.3s ease',
                    animation: done ? 'pulseGreen 0.4s ease' : 'none',
                  }}>
                    {done ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                  </div>
                  <div style={{ fontSize: 9, opacity: active ? 1 : 0.6, fontWeight: active ? 700 : 400, color: '#fff' }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 4 }}>
            <div style={{
              height: 4, borderRadius: 99,
              background: step === STEPS.length ? '#10B981' : '#fff',
              width: `${pct}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
            Step {step} of {STEPS.length}
          </div>
        </div>

        {/* ── Body ── */}
        <div className={direction === 'forward' ? 'step-slide' : 'step-slide-back'}
          style={{ padding: '28px 32px', minHeight: 360 }}>

          {/* ─── STEP 1: Basic Information ─── */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F2744', marginBottom: 4 }}>Basic Information</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Tell us about yourself and your affiliation.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle(errors.fullName)} placeholder="Dr. Jane Smith"
                    value={basic.fullName} onChange={e => setBasic(b => ({ ...b, fullName: e.target.value }))} />
                  {errors.fullName && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.fullName}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input style={inputStyle()} placeholder="India / USA / UK"
                    value={basic.country} onChange={e => setBasic(b => ({ ...b, country: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Organization</label>
                  <input style={inputStyle()} placeholder="MIT / Stanford / IIT"
                    value={basic.organization} onChange={e => setBasic(b => ({ ...b, organization: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input style={inputStyle()} placeholder="Dept. of Computer Science"
                    value={basic.department} onChange={e => setBasic(b => ({ ...b, department: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Designation / Title</label>
                <input style={inputStyle()} placeholder="Professor / PhD Scholar / CTO / Researcher"
                  value={basic.designation} onChange={e => setBasic(b => ({ ...b, designation: e.target.value }))} />
              </div>
            </div>
          )}

          {/* ─── STEP 2: Research Domain & Areas ─── */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F2744', marginBottom: 4 }}>Research Domain & Areas</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>This helps us match funding opportunities, papers and patents to your work.</p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Primary Research Domain *</label>
                <select value={research.researchDomain}
                  onChange={e => setResearch(r => ({ ...r, researchDomain: e.target.value, researchAreas: [], researchInterests: [] }))}
                  style={{ ...inputStyle(errors.researchDomain), appearance: 'none' }}>
                  <option value="">Select your primary research domain</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.researchDomain && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.researchDomain}</span>}
              </div>

              {suggestedAreas.length > 0 && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Research Sub-areas</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {suggestedAreas.map(a => (
                        <Chip key={a} label={a} selected={research.researchAreas.includes(a)} onClick={() => toggleArea(a)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Research Interests</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {suggestedAreas.map(a => (
                        <Chip key={a} label={a} selected={research.researchInterests.includes(a)} onClick={() => toggleInterest(a)} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>These define what you're interested in following, even outside your primary sub-area.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── STEP 3: Keywords & Technology ─── */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F2744', marginBottom: 4 }}>Keywords & Technology</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Used to find relevant research, grants, and patents across all modules.</p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Research Keywords</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...inputStyle(), flex: 1 }} placeholder="e.g. Transformers, LLMs, CRISPR…"
                    value={kw.kwInput}
                    onChange={e => setKw(k => ({ ...k, kwInput: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} />
                  <button type="button" onClick={addKeyword} style={{
                    padding: '10px 16px', background: '#2563EB', color: '#fff', border: 'none',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  }}>+ Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {kw.researchKeywords.map(w => (
                    <TagPill key={w} label={w} onRemove={() => setKw(k => ({ ...k, researchKeywords: k.researchKeywords.filter(x => x !== w) }))} />
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Technology Areas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {TECH_SUGGESTIONS.map(t => (
                    <Chip key={t} label={t} selected={kw.technologyAreas.includes(t)} onClick={() => toggleTech(t)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Publications ─── */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F2744', marginBottom: 4 }}>Publications</h3>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Add your publications, or skip and add them later from your profile.</p>
                </div>
                <button onClick={() => setShowPubForm(s => !s)} style={{
                  padding: '8px 14px', background: showPubForm ? '#F1F5F9' : '#2563EB',
                  color: showPubForm ? '#475569' : '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Plus size={14} /> Add Publication
                </button>
              </div>

              {showPubForm && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Title *</label>
                      <input style={inputStyle()} placeholder="Publication title"
                        value={pubForm.title} onChange={e => setPubForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Authors</label>
                      <input style={inputStyle()} placeholder="Author 1, Author 2"
                        value={pubForm.authors} onChange={e => setPubForm(p => ({ ...p, authors: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Publication Date</label>
                      <input type="date" style={inputStyle()}
                        value={pubForm.pub_date} onChange={e => setPubForm(p => ({ ...p, pub_date: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Journal / Conference</label>
                      <input style={inputStyle()} placeholder="Nature / ICML 2025"
                        value={pubForm.journal || pubForm.conference}
                        onChange={e => setPubForm(p => ({ ...p, journal: e.target.value, conference: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Type</label>
                      <select style={{ ...inputStyle(), appearance: 'none' }}
                        value={pubForm.pub_type} onChange={e => setPubForm(p => ({ ...p, pub_type: e.target.value }))}>
                        {PUB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>DOI / URL</label>
                      <input style={inputStyle()} placeholder="https://doi.org/..."
                        value={pubForm.doi || pubForm.url} onChange={e => setPubForm(p => ({ ...p, doi: e.target.value, url: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addPub} style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Save Publication
                    </button>
                    <button onClick={() => setShowPubForm(false)} style={{ padding: '8px 14px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {publications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                  <FileText size={32} style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13 }}>No publications added yet. You can skip this step.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {publications.map((p, i) => (
                    <div key={p.id || i} style={{
                      background: '#F8FAFC', borderRadius: 8, padding: '10px 14px',
                      border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F2744' }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{p.pub_type} · {p.journal || p.conference || '—'} · {p.pub_date || '—'}</div>
                      </div>
                      <button onClick={() => setPublications(pubs => pubs.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 5: Patents ─── */}
          {step === 5 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F2744', marginBottom: 4 }}>Patents</h3>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Add your filed or granted patents, or skip this step.</p>
                </div>
                <button onClick={() => setShowPatForm(s => !s)} style={{
                  padding: '8px 14px', background: showPatForm ? '#F1F5F9' : '#2563EB',
                  color: showPatForm ? '#475569' : '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Plus size={14} /> Add Patent
                </button>
              </div>

              {showPatForm && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Patent Title *</label>
                      <input style={inputStyle()} placeholder="Title of the patent"
                        value={patForm.title} onChange={e => setPatForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Patent Number</label>
                      <input style={inputStyle()} placeholder="US 12,345,678"
                        value={patForm.patent_number} onChange={e => setPatForm(p => ({ ...p, patent_number: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Inventor(s)</label>
                      <input style={inputStyle()} placeholder="Inventor Name(s)"
                        value={patForm.inventor} onChange={e => setPatForm(p => ({ ...p, inventor: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Filing Date</label>
                      <input type="date" style={inputStyle()}
                        value={patForm.filing_date} onChange={e => setPatForm(p => ({ ...p, filing_date: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select style={{ ...inputStyle(), appearance: 'none' }}
                        value={patForm.status} onChange={e => setPatForm(p => ({ ...p, status: e.target.value }))}>
                        {PATENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Domain</label>
                      <input style={inputStyle()} placeholder="AI / Biotech / Clean Energy"
                        value={patForm.domain} onChange={e => setPatForm(p => ({ ...p, domain: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Patent URL</label>
                      <input style={inputStyle()} placeholder="https://patents.google.com/..."
                        value={patForm.patent_url} onChange={e => setPatForm(p => ({ ...p, patent_url: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addPat} style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Save Patent
                    </button>
                    <button onClick={() => setShowPatForm(false)} style={{ padding: '8px 14px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {patents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                  <Award size={32} style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13 }}>No patents added yet. You can skip this step.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {patents.map((p, i) => (
                    <div key={p.id || i} style={{
                      background: '#F8FAFC', borderRadius: 8, padding: '10px 14px',
                      border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F2744' }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{p.status} · {p.patent_number || '—'} · {p.domain || '—'}</div>
                      </div>
                      <button onClick={() => setPatents(pats => pats.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 6: Complete ─── */}
          {step === 6 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', animation: 'pulseGreen 2s ease infinite',
              }}>
                <CheckCircle2 size={36} color="#fff" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F2744', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>
                Your Research Profile is Ready!
              </h3>
              <p style={{ fontSize: 14, color: '#64748B', maxWidth: 400, margin: '0 auto 24px' }}>
                Your profile will personalize funding opportunities, research papers, patents, and technology intelligence across all modules.
              </p>

              {/* Summary */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Name: </span><span style={{ color: '#0F2744', fontWeight: 700 }}>{basic.fullName}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Domain: </span><span style={{ color: '#0F2744', fontWeight: 700 }}>{research.researchDomain || '—'}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Organization: </span><span style={{ color: '#0F2744' }}>{basic.organization || '—'}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Sub-areas: </span><span style={{ color: '#0F2744' }}>{research.researchAreas.length}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Keywords: </span><span style={{ color: '#0F2744' }}>{kw.researchKeywords.length}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Technologies: </span><span style={{ color: '#0F2744' }}>{kw.technologyAreas.length}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Publications: </span><span style={{ color: '#0F2744' }}>{publications.length}</span></div>
                  <div><span style={{ color: '#94A3B8', fontWeight: 600 }}>Patents: </span><span style={{ color: '#0F2744' }}>{patents.length}</span></div>
                </div>
              </div>

              <button onClick={handleComplete} disabled={saving} style={{
                width: '100%', padding: '14px', background: saving ? '#93C5FD' : '#2563EB',
                color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.2s',
              }}>
                {saving ? (
                  <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Saving Profile…</>
                ) : (
                  <><CheckCircle2 size={18} /> Complete Profile & Launch Dashboard <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer Navigation ── */}
        {step < 6 && (
          <div style={{
            padding: '16px 32px', borderTop: '1px solid #E2E8F0', background: '#FAFCFE',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {step > 1 ? (
              <button onClick={goBack} style={{
                padding: '10px 20px', background: '#F1F5F9', color: '#475569',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 10 }}>
              {(step === 4 || step === 5) && (
                <button onClick={goNext} style={{
                  padding: '10px 18px', background: '#F1F5F9', color: '#475569',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                  Skip
                </button>
              )}
              <button onClick={goNext} style={{
                padding: '10px 22px', background: '#2563EB', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {step === 5 ? 'Review & Complete' : 'Next'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
