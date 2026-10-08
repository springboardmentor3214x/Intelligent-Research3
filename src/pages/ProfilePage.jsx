import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchPublications, addPublication, updatePublication, deletePublication,
  fetchUserPatents, addUserPatent, updateUserPatent, deleteUserPatent
} from '../services/profileService';
import {
  User, Building2, Globe, Briefcase, BookOpen, Tag, Cpu,
  FileText, Award, Edit3, Trash2, Plus, ExternalLink,
  CheckCircle2, Sparkles, X, ChevronRight, ArrowLeft,
  LayoutDashboard, DollarSign, FlaskConical, Search, Calendar,
  Layers, ShieldCheck, Save, AlertCircle, Bell, FileBarChart2
} from 'lucide-react';

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

const PUB_TYPES = ['Journal Article', 'Conference Paper', 'Book Chapter', 'Preprint', 'Technical Report', 'Thesis', 'Review Article'];
const PATENT_STATUSES = ['Filed', 'Pending', 'Published', 'Granted', 'Expired'];

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'publications' | 'patents'
  const [publications, setPublications] = useState([]);
  const [patents, setPatents] = useState([]);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [loadingPats, setLoadingPats] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    organization: '',
    department: '',
    designation: '',
    country: '',
    researchDomain: '',
    researchAreas: [],
    researchInterests: [],
    researchKeywords: [],
    technologyAreas: [],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Publications modal & state
  const [pubModalOpen, setPubModalOpen] = useState(false);
  const [editingPubId, setEditingPubId] = useState(null);
  const [pubForm, setPubForm] = useState({
    title: '',
    authors: '',
    pub_date: '',
    journal: '',
    conference: '',
    pub_type: 'Journal Article',
    research_domain: '',
    keywords: '',
    doi: '',
    url: '',
  });

  // Patents modal & state
  const [patModalOpen, setPatModalOpen] = useState(false);
  const [editingPatId, setEditingPatId] = useState(null);
  const [patForm, setPatForm] = useState({
    title: '',
    patent_number: '',
    inventor: '',
    filing_date: '',
    publication_date: '',
    status: 'Filed',
    domain: '',
    patent_url: '',
  });

  // Search filters
  const [pubSearch, setPubSearch] = useState('');
  const [patSearch, setPatSearch] = useState('');

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        role: profile.role || '',
        organization: profile.organization || '',
        department: profile.department || '',
        designation: profile.designation || '',
        country: profile.country || '',
        researchDomain: profile.researchDomain || '',
        researchAreas: profile.researchAreas || [],
        researchInterests: profile.researchInterests || [],
        researchKeywords: profile.researchKeywords || [],
        technologyAreas: profile.technologyAreas || [],
      });
    }
  }, [profile]);

  // Load user publications and patents
  const loadUserData = async () => {
    if (!user?.id) return;
    setLoadingPubs(true);
    setLoadingPats(true);
    try {
      const pubs = await fetchPublications(user.id);
      setPublications(pubs || []);
    } catch (e) {
      console.warn('Error loading pubs:', e);
    } finally {
      setLoadingPubs(false);
    }

    try {
      const pats = await fetchUserPatents(user.id);
      setPatents(pats || []);
    } catch (e) {
      console.warn('Error loading pats:', e);
    } finally {
      setLoadingPats(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  // Handle Edit Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccessMsg('');
    try {
      await updateProfile(formData);
      setSaveSuccessMsg('Research Profile successfully updated!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setActiveTab('overview');
      }, 1400);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle research area
  const toggleArea = (area) => {
    setFormData(prev => ({
      ...prev,
      researchAreas: prev.researchAreas.includes(area)
        ? prev.researchAreas.filter(a => a !== area)
        : [...prev.researchAreas, area],
    }));
  };

  // Tag helpers
  const addTag = (field, value, setVal) => {
    const trimmed = value.trim();
    if (trimmed && !formData[field].includes(trimmed)) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], trimmed] }));
    }
    setVal('');
  };

  const removeTag = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== item),
    }));
  };

  // Publications Handlers
  const handleOpenPubModal = (pub = null) => {
    if (pub) {
      setEditingPubId(pub.id);
      setPubForm({
        title: pub.title || '',
        authors: Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || ''),
        pub_date: pub.pub_date || '',
        journal: pub.journal || '',
        conference: pub.conference || '',
        pub_type: pub.pub_type || 'Journal Article',
        research_domain: pub.research_domain || formData.researchDomain || '',
        keywords: Array.isArray(pub.keywords) ? pub.keywords.join(', ') : (pub.keywords || ''),
        doi: pub.doi || '',
        url: pub.url || '',
      });
    } else {
      setEditingPubId(null);
      setPubForm({
        title: '',
        authors: formData.fullName || '',
        pub_date: new Date().toISOString().split('T')[0],
        journal: '',
        conference: '',
        pub_type: 'Journal Article',
        research_domain: formData.researchDomain || '',
        keywords: '',
        doi: '',
        url: '',
      });
    }
    setPubModalOpen(true);
  };

  const handleSavePublication = async (e) => {
    e.preventDefault();
    if (!pubForm.title.trim()) return;

    const payload = {
      ...pubForm,
      authors: pubForm.authors.split(',').map(a => a.trim()).filter(Boolean),
      keywords: pubForm.keywords.split(',').map(k => k.trim()).filter(Boolean),
    };

    if (editingPubId) {
      await updatePublication(user.id, editingPubId, payload);
    } else {
      await addPublication(user.id, payload);
    }
    await loadUserData();
    setPubModalOpen(false);
  };

  const handleDeletePublication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this publication?')) return;
    await deletePublication(user.id, id);
    await loadUserData();
  };

  // Patents Handlers
  const handleOpenPatModal = (pat = null) => {
    if (pat) {
      setEditingPatId(pat.id);
      setPatForm({
        title: pat.title || '',
        patent_number: pat.patent_number || '',
        inventor: pat.inventor || '',
        filing_date: pat.filing_date || '',
        publication_date: pat.publication_date || '',
        status: pat.status || 'Filed',
        domain: pat.domain || formData.researchDomain || '',
        patent_url: pat.patent_url || '',
      });
    } else {
      setEditingPatId(null);
      setPatForm({
        title: '',
        patent_number: '',
        inventor: formData.fullName || '',
        filing_date: new Date().toISOString().split('T')[0],
        publication_date: '',
        status: 'Filed',
        domain: formData.researchDomain || '',
        patent_url: '',
      });
    }
    setPatModalOpen(true);
  };

  const handleSavePatent = async (e) => {
    e.preventDefault();
    if (!patForm.title.trim()) return;

    if (editingPatId) {
      await updateUserPatent(user.id, editingPatId, patForm);
    } else {
      await addUserPatent(user.id, patForm);
    }
    await loadUserData();
    setPatModalOpen(false);
  };

  const handleDeletePatent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patent?')) return;
    await deleteUserPatent(user.id, id);
    await loadUserData();
  };

  const filteredPubs = publications.filter(p =>
    (p.title || '').toLowerCase().includes(pubSearch.toLowerCase()) ||
    (p.journal || '').toLowerCase().includes(pubSearch.toLowerCase()) ||
    (p.pub_type || '').toLowerCase().includes(pubSearch.toLowerCase())
  );

  const filteredPats = patents.filter(p =>
    (p.title || '').toLowerCase().includes(patSearch.toLowerCase()) ||
    (p.patent_number || '').toLowerCase().includes(patSearch.toLowerCase()) ||
    (p.status || '').toLowerCase().includes(patSearch.toLowerCase())
  );

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RP';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif', color: '#0F172A' }}>
      {/* Top Navigation Bar */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9',
              border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 14px',
              fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div style={{ height: 24, width: 1, background: '#E2E8F0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #0F2744 0%, #2563EB 100%)',
              color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              M2
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Research Profile Management</span>
              <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>Module 2 · Identity &amp; Portfolio</span>
            </div>
          </div>
        </div>

        {/* Cross Module Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/research')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: '#EFF6FF',
              border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 11px',
              fontSize: 12, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer'
            }}
          >
            <LayoutDashboard size={13} /> Research (M3)
          </button>
          <button
            onClick={() => navigate('/funding')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: '#ECFDF5',
              border: '1px solid #A7F3D0', borderRadius: 8, padding: '6px 11px',
              fontSize: 12, fontWeight: 600, color: '#047857', cursor: 'pointer'
            }}
          >
            <DollarSign size={13} /> Funding (M4)
          </button>
          <button
            onClick={() => navigate('/patents')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: '#F5F3FF',
              border: '1px solid #DDD6FE', borderRadius: 8, padding: '6px 11px',
              fontSize: 12, fontWeight: 600, color: '#7C3AED', cursor: 'pointer'
            }}
          >
            <FlaskConical size={13} /> Patents (M5)
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: '#F1F5F9',
              border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 11px',
              fontSize: 12, fontWeight: 600, color: '#1E293B', cursor: 'pointer'
            }}
          >
            <LayoutDashboard size={13} /> Dashboard (M9)
          </button>
          <button
            onClick={() => navigate('/alerts')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: '#FEE2E2',
              border: '1px solid #FECACA', borderRadius: 8, padding: '6px 11px',
              fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer'
            }}
          >
            <Bell size={13} /> Alerts (M10)
          </button>
          <button
            onClick={() => navigate('/reports')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: '#EEF2FF',
              border: '1px solid #C7D2FE', borderRadius: 8, padding: '6px 11px',
              fontSize: 12, fontWeight: 600, color: '#4F46E5', cursor: 'pointer'
            }}
          >
            <FileBarChart2 size={13} /> Reports (M11)
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px' }}>

        {/* Profile Identity Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2744 0%, #1E3A5F 60%, #1E40AF 100%)',
          borderRadius: 16, padding: '28px 32px', color: '#fff', marginBottom: 24,
          boxShadow: '0 4px 16px rgba(15,39,68,0.12)', display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%', background: '#fff',
              color: '#1E3A5F', fontSize: 28, fontWeight: 800, display: 'flex',
              alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '3px solid #60A5FA'
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                  {profile?.fullName || user?.user_metadata?.full_name || 'Researcher'}
                </h1>
                <span style={{
                  background: 'rgba(34,197,94,0.2)', border: '1px solid #4ADE80',
                  color: '#86EFAC', borderRadius: 99, padding: '2px 10px', fontSize: 11.5,
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <ShieldCheck size={13} /> Verified Profile
                </span>
                {profile?.role && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '2px 10px',
                    fontSize: 11.5, fontWeight: 600, color: '#E2E8F0'
                  }}>
                    {profile.role}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13, color: '#CBD5E1', flexWrap: 'wrap' }}>
                {profile?.designation && <span>{profile.designation}</span>}
                {profile?.department && <span>• {profile.department}</span>}
                {profile?.organization && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={14} /> {profile.organization}
                  </span>
                )}
                {profile?.country && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={14} /> {profile.country}
                  </span>
                )}
              </div>

              {profile?.researchDomain && (
                <div style={{ marginTop: 10 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#93C5FD'
                  }}>
                    <BookOpen size={13} /> Primary Domain: {profile.researchDomain}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '12px 18px', textAlign: 'center', minWidth: 90
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#60A5FA' }}>{publications.length}</div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Publications</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '12px 18px', textAlign: 'center', minWidth: 90
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#C084FC' }}>{patents.length}</div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patents</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '12px 18px', textAlign: 'center', minWidth: 90
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399' }}>{profile?.researchAreas?.length || 0}</div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Areas</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              padding: '12px 18px', textAlign: 'center', minWidth: 90
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FBBF24' }}>{profile?.technologyAreas?.length || 0}</div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tech Stack</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: 6, borderBottom: '2px solid #E2E8F0',
          marginBottom: 24, background: '#fff', borderRadius: '12px 12px 0 0',
          padding: '8px 12px 0 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          {[
            { id: 'overview', label: 'Profile Overview', icon: User },
            { id: 'edit', label: 'Edit Profile & Details', icon: Edit3 },
            { id: 'publications', label: `Publications (${publications.length})`, icon: FileText },
            { id: 'patents', label: `Patents (${patents.length})`, icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2563EB' : '#64748B',
                  borderBottom: isActive ? '3px solid #2563EB' : '3px solid transparent',
                  marginBottom: -2, transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW                                               */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* Basic Information Card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} color="#2563EB" /> Basic Information
                </h3>
                <button
                  onClick={() => setActiveTab('edit')}
                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Full Name</span>
                  <span style={{ fontWeight: 600 }}>{profile?.fullName || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Email</span>
                  <span style={{ fontWeight: 600, color: '#2563EB' }}>{profile?.email || user?.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Organization / Affiliation</span>
                  <span style={{ fontWeight: 600 }}>{profile?.organization || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Department</span>
                  <span style={{ fontWeight: 600 }}>{profile?.department || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Designation / Title</span>
                  <span style={{ fontWeight: 600 }}>{profile?.designation || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                  <span style={{ color: '#64748B' }}>Country</span>
                  <span style={{ fontWeight: 600 }}>{profile?.country || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Research Focus Card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={18} color="#2563EB" /> Research Domain &amp; Areas
                </h3>
                <button
                  onClick={() => setActiveTab('edit')}
                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Primary Domain</span>
                <div style={{ marginTop: 4, fontWeight: 700, fontSize: 14, color: '#1E3A5F' }}>
                  {profile?.researchDomain || 'No primary domain selected'}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Specialized Research Areas</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {profile?.researchAreas && profile.researchAreas.length > 0 ? (
                    profile.researchAreas.map(area => (
                      <span key={area} style={{
                        background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE',
                        borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600
                      }}>
                        {area}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No specialized areas selected yet</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Research Interests</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {profile?.researchInterests && profile.researchInterests.length > 0 ? (
                    profile.researchInterests.map(item => (
                      <span key={item} style={{
                        background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1',
                        borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500
                      }}>
                        {item}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>None specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Keywords & Technology Areas Card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={18} color="#2563EB" /> Research Keywords &amp; Technology Areas
                </h3>
                <button
                  onClick={() => setActiveTab('edit')}
                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Research Keywords ({profile?.researchKeywords?.length || 0})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile?.researchKeywords && profile.researchKeywords.length > 0 ? (
                      profile.researchKeywords.map(kw => (
                        <span key={kw} style={{
                          background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
                          borderRadius: 99, padding: '4px 12px', fontSize: 12.5, fontWeight: 600
                        }}>
                          #{kw}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No keywords added</span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Technology Stack &amp; Tools ({profile?.technologyAreas?.length || 0})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile?.technologyAreas && profile.technologyAreas.length > 0 ? (
                      profile.technologyAreas.map(tech => (
                        <span key={tech} style={{
                          background: '#F5F3FF', color: '#6B21A8', border: '1px solid #E9D5FF',
                          borderRadius: 6, padding: '4px 12px', fontSize: 12.5, fontWeight: 600
                        }}>
                          <Cpu size={12} style={{ display: 'inline', marginRight: 4 }} />{tech}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No technologies selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: EDIT PROFILE                                            */}
        {/* ============================================================== */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} style={{ background: '#fff', borderRadius: 12, padding: 32, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0F172A' }}>Edit Research Profile</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                  Update your researcher metadata, institution affiliations, and discovery preferences.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB',
                  color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px',
                  fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {savingProfile ? <Sparkles size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {savingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>

            {saveSuccessMsg && (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                borderRadius: 8, padding: '10px 16px', fontSize: 13.5, fontWeight: 600,
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <CheckCircle2 size={16} color="#047857" /> {saveSuccessMsg}
              </div>
            )}

            {/* Basic Info Fields */}
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. Identity &amp; Organization
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Organization / University *</label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={e => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Stanford University / MIT / Infosys"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Dept. of Computer Science"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Designation / Title</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Principal Investigator / Senior Fellow"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. United States, India, Germany"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Research Domain */}
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5F', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              2. Research Domain &amp; Focus
            </h4>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Primary Research Domain *</label>
              <select
                value={formData.researchDomain}
                onChange={e => setFormData({ ...formData, researchDomain: e.target.value, researchAreas: [] })}
                style={{ width: '100%', maxWidth: 450, padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
              >
                <option value="">Select Primary Domain</option>
                {DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Specialized Areas */}
            {formData.researchDomain && AREA_SUGGESTIONS[formData.researchDomain] && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                  Specialized Research Areas (click to toggle):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AREA_SUGGESTIONS[formData.researchDomain].map(area => {
                    const isSelected = formData.researchAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleArea(area)}
                        style={{
                          padding: '6px 14px', borderRadius: 99, fontSize: 12.5, fontWeight: 600,
                          cursor: 'pointer', border: isSelected ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                          background: isSelected ? '#EFF6FF' : '#fff',
                          color: isSelected ? '#1D4ED8' : '#475569',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        {isSelected && <CheckCircle2 size={13} color="#2563EB" />} {area}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Keywords */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                Research Keywords
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. Transformers, Graph Neural Networks, CRISPR-Cas9"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('researchKeywords', keywordInput, setKeywordInput))}
                  style={{ flex: 1, maxWidth: 450, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={() => addTag('researchKeywords', keywordInput, setKeywordInput)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {formData.researchKeywords.map(kw => (
                  <span key={kw} style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    #{kw}
                    <button type="button" onClick={() => removeTag('researchKeywords', kw)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#166534' }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                Technologies &amp; Tools Stack
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {TECH_SUGGESTIONS.map(t => {
                  const isSelected = formData.technologyAreas.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (isSelected) removeTag('technologyAreas', t);
                        else addTag('technologyAreas', t, () => {});
                      }}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: isSelected ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                        background: isSelected ? '#F5F3FF' : '#F8FAFC',
                        color: isSelected ? '#6B21A8' : '#64748B'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 18 }}>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 20px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PUBLICATIONS (Module 2.2)                              */}
        {/* ============================================================== */}
        {activeTab === 'publications' && (
          <div>
            {/* Header / Actions */}
            <div style={{
              background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0',
              marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search publications by title, journal, type..."
                  value={pubSearch}
                  onChange={e => setPubSearch(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13.5, background: 'transparent' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                  Showing {filteredPubs.length} of {publications.length}
                </span>
                <button
                  onClick={() => handleOpenPubModal()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB',
                    color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> Add Publication
                </button>
              </div>
            </div>

            {/* Publications List */}
            {loadingPubs ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                <Sparkles size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: 8 }}>Loading publications...</p>
              </div>
            ) : filteredPubs.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center',
                border: '1.5px dashed #CBD5E1'
              }}>
                <FileText size={40} color="#94A3B8" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>No Publications Found</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0' }}>
                  {pubSearch ? 'No publications match your search query.' : 'Add your published papers, conference proceedings, or preprints to complete your portfolio.'}
                </p>
                <button
                  onClick={() => handleOpenPubModal()}
                  style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add First Publication
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredPubs.map(pub => (
                  <div
                    key={pub.id}
                    style={{
                      background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: 18, transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                          borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700
                        }}>
                          {pub.pub_type || 'Journal Article'}
                        </span>
                        {pub.research_domain && (
                          <span style={{
                            background: '#F1F5F9', color: '#475569', borderRadius: 4,
                            padding: '2px 8px', fontSize: 11, fontWeight: 600
                          }}>
                            {pub.research_domain}
                          </span>
                        )}
                        {pub.pub_date && (
                          <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> {pub.pub_date}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {pub.title}
                      </h3>

                      <p style={{ fontSize: 13, color: '#475569', margin: '0 0 6px 0' }}>
                        <strong>Authors:</strong> {Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}
                      </p>

                      {(pub.journal || pub.conference) && (
                        <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                          Published in: {pub.journal || pub.conference}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                        {pub.doi && (
                          <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                            DOI: {pub.doi}
                          </span>
                        )}
                        {pub.url && (
                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}
                          >
                            View Document <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleOpenPubModal(pub)}
                        title="Edit Publication"
                        style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', color: '#475569', cursor: 'pointer' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePublication(pub.id)}
                        title="Delete Publication"
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '7px 10px', color: '#DC2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PATENTS (Module 2.3)                                   */}
        {/* ============================================================== */}
        {activeTab === 'patents' && (
          <div>
            {/* Header / Actions */}
            <div style={{
              background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0',
              marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search patents by title, patent number, status..."
                  value={patSearch}
                  onChange={e => setPatSearch(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13.5, background: 'transparent' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                  Showing {filteredPats.length} of {patents.length}
                </span>
                <button
                  onClick={() => handleOpenPatModal()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: '#7C3AED',
                    color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> Add Patent
                </button>
              </div>
            </div>

            {/* Patents List */}
            {loadingPats ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                <Sparkles size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: 8 }}>Loading patents...</p>
              </div>
            ) : filteredPats.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center',
                border: '1.5px dashed #CBD5E1'
              }}>
                <Award size={40} color="#94A3B8" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>No Patents Registered</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0' }}>
                  {patSearch ? 'No patents match your search query.' : 'Record your filed, pending, or granted patents to showcase your intellectual property portfolio.'}
                </p>
                <button
                  onClick={() => handleOpenPatModal()}
                  style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add First Patent
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredPats.map(pat => {
                  const statusColors = {
                    Granted: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
                    Published: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
                    Pending: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
                    Filed: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
                    Expired: { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' },
                  }[pat.status] || { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

                  return (
                    <div
                      key={pat.id}
                      style={{
                        background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: 18
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            background: statusColors.bg, color: statusColors.text, border: `1px solid ${statusColors.border}`,
                            borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700
                          }}>
                            {pat.status || 'Filed'}
                          </span>
                          {pat.patent_number && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                              #{pat.patent_number}
                            </span>
                          )}
                          {pat.domain && (
                            <span style={{ background: '#F1F5F9', color: '#475569', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                              {pat.domain}
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                          {pat.title}
                        </h3>

                        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 6px 0' }}>
                          <strong>Inventor:</strong> {pat.inventor || 'N/A'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: '#64748B', marginTop: 8, flexWrap: 'wrap' }}>
                          {pat.filing_date && <span>Filing Date: {pat.filing_date}</span>}
                          {pat.publication_date && <span>• Publication Date: {pat.publication_date}</span>}
                          {pat.patent_url && (
                            <a
                              href={pat.patent_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}
                            >
                              Patent Register <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => handleOpenPatModal(pat)}
                          title="Edit Patent"
                          style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '7px 10px', color: '#475569', cursor: 'pointer' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePatent(pat.id)}
                          title="Delete Patent"
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '7px 10px', color: '#DC2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* PUBLICATION MODAL FORM                                         */}
      {/* ============================================================== */}
      {pubModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 39, 68, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0F172A' }}>
                {editingPubId ? 'Edit Publication' : 'Add New Publication'}
              </h3>
              <button onClick={() => setPubModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePublication} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Publication Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attention Is All You Need"
                  value={pubForm.title}
                  onChange={e => setPubForm({ ...pubForm, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Authors (comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vaswani A., Shazeer N., Parmar N."
                  value={pubForm.authors}
                  onChange={e => setPubForm({ ...pubForm, authors: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Publication Type</label>
                  <select
                    value={pubForm.pub_type}
                    onChange={e => setPubForm({ ...pubForm, pub_type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
                  >
                    {PUB_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Publication Date</label>
                  <input
                    type="date"
                    value={pubForm.pub_date}
                    onChange={e => setPubForm({ ...pubForm, pub_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Journal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nature, IEEE TPAMI"
                    value={pubForm.journal}
                    onChange={e => setPubForm({ ...pubForm, journal: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Conference Name</label>
                  <input
                    type="text"
                    placeholder="e.g. NeurIPS 2023, ICML"
                    value={pubForm.conference}
                    onChange={e => setPubForm({ ...pubForm, conference: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>DOI</label>
                  <input
                    type="text"
                    placeholder="10.1145/..."
                    value={pubForm.doi}
                    onChange={e => setPubForm({ ...pubForm, doi: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Document URL</label>
                  <input
                    type="url"
                    placeholder="https://arxiv.org/abs/..."
                    value={pubForm.url}
                    onChange={e => setPubForm({ ...pubForm, url: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setPubModalOpen(false)}
                  style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingPubId ? 'Update Publication' : 'Add Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PATENT MODAL FORM                                              */}
      {/* ============================================================== */}
      {patModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 39, 68, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0F172A' }}>
                {editingPatId ? 'Edit Patent' : 'Add New Patent'}
              </h3>
              <button onClick={() => setPatModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePatent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Patent Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Neural Architecture Search System"
                  value={patForm.title}
                  onChange={e => setPatForm({ ...patForm, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Patent Number / App #</label>
                  <input
                    type="text"
                    placeholder="e.g. US11892014B2 / EP3420190"
                    value={patForm.patent_number}
                    onChange={e => setPatForm({ ...patForm, patent_number: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Patent Status</label>
                  <select
                    value={patForm.status}
                    onChange={e => setPatForm({ ...patForm, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
                  >
                    {PATENT_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Inventor(s)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Doe, John Smith"
                  value={patForm.inventor}
                  onChange={e => setPatForm({ ...patForm, inventor: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Filing Date</label>
                  <input
                    type="date"
                    value={patForm.filing_date}
                    onChange={e => setPatForm({ ...patForm, filing_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Publication Date</label>
                  <input
                    type="date"
                    value={patForm.publication_date}
                    onChange={e => setPatForm({ ...patForm, publication_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Patent URL / Link</label>
                <input
                  type="url"
                  placeholder="https://patents.google.com/patent/..."
                  value={patForm.patent_url}
                  onChange={e => setPatForm({ ...patForm, patent_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setPatModalOpen(false)}
                  style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingPatId ? 'Update Patent' : 'Add Patent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
