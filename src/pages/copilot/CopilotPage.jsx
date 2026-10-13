import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { useAuth } from '../../context/AuthContext';
import { copilotService } from '../../services/copilotService';
import { exportCopilotIdeasAssessmentPDF } from '../../services/reportExportHelper';
import CopilotRobot from '../../components/copilot/CopilotRobot';
import '../../styles/copilot.css';

import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Lightbulb,
  Compass,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Download,
  Share2,
  Send,
  Plus,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Calendar,
  Database,
  BarChart2,
  ShieldAlert,
  Layers,
  Award,
  Sliders,
  X,
  Target,
  Zap,
} from 'lucide-react';

const STAGE_CONFIG = [
  { id: 1, title: 'Concept Foundation', icon: BookOpen, desc: 'Beginner-friendly domain intuition & glossary' },
  { id: 2, title: 'Real Literature', icon: FileText, desc: 'Real peer-reviewed papers & empirical findings' },
  { id: 3, title: 'Gap Matrix', icon: HelpCircle, desc: 'Evidence-based comparative gap analysis' },
  { id: 4, title: 'Candidate Ideas', icon: Lightbulb, desc: 'Feasible, high-impact research questions' },
  { id: 5, title: 'Project Blueprint', icon: Compass, desc: 'Actionable methodology, datasets & 6-mo roadmap' },
];

export default function CopilotPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userId = user?.id || 'demo-user-eval-01';

  // Session state
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [projectPlan, setProjectPlan] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);

  // Input & loading
  const [inputMessage, setInputMessage] = useState('');
  const [selectedStageOverride, setSelectedStageOverride] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals & Drawers
  const [showNewModal, setShowNewModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showFlightDeck, setShowFlightDeck] = useState(true);

  // New session form
  const [newTopic, setNewTopic] = useState('');
  const [newDomain, setNewDomain] = useState('Artificial Intelligence');
  const [newUserLevel, setNewUserLevel] = useState('Beginner');
  const [newSkills, setNewSkills] = useState('Python, PyTorch');
  const [newResources, setNewResources] = useState('1x Cloud GPU, 6 months part-time');

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial load: Fetch sessions
  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      const list = await copilotService.listSessions(userId);
      setSessions(list);
      if (list.length > 0 && !activeSession) {
        loadSessionDetails(list[0].id);
      }
    } catch (err) {
      console.warn('Could not load sessions:', err);
    }
  };

  const launchDirectTopic = async (topic, domain = 'Artificial Intelligence') => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const created = await copilotService.createSession(
        {
          topic,
          title: topic,
          domain,
          user_level: 'Beginner',
          skills: ['Python', 'PyTorch'],
          resources: '1x Cloud GPU, 6 months',
        },
        userId
      );
      setSessions((prev) => [created, ...prev]);
      await loadSessionDetails(created.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start research discovery session.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await copilotService.getSession(sessionId, userId);
      const sessionObj = res.session || res;
      setActiveSession(sessionObj);
      setMessages(res.messages || sessionObj.messages || []);
      setIdeas(res.ideas || sessionObj.ideas || []);
      const plan = res.plans?.[0] || sessionObj.plans?.[0] || res.project_plan || sessionObj.project_plan || null;
      setProjectPlan(plan);
      setCurrentStage(sessionObj.current_stage || 1);

      // Cache session for Module 11 Reports consumption
      saveSessionToLocalCache({
        ...sessionObj,
        ideas: res.ideas || sessionObj.ideas || [],
        project_plan: plan,
        messages: res.messages || sessionObj.messages || [],
      });
    } catch (err) {
      console.warn('Could not load session details:', err);
      // Clean up orphaned or stale session IDs
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActiveSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessionToLocalCache = (sessionData) => {
    if (!sessionData || !sessionData.id) return;
    try {
      const cached = JSON.parse(localStorage.getItem('ri_copilot_saved_sessions') || '[]');
      const filtered = cached.filter((s) => s.id !== sessionData.id);
      filtered.unshift({
        id: sessionData.id,
        topic: sessionData.topic,
        domain: sessionData.domain,
        user_level: sessionData.user_level,
        current_stage: sessionData.current_stage,
        updated_at: sessionData.updated_at,
        ideas: sessionData.ideas || [],
        project_plan: sessionData.project_plan || null,
        message_count: sessionData.messages?.length || 0,
      });
      localStorage.setItem('ri_copilot_saved_sessions', JSON.stringify(filtered.slice(0, 10)));
    } catch (e) {
      console.warn('Failed to cache copilot session for reports:', e);
    }
  };

  const handleCreateSession = async (e) => {
    e?.preventDefault();
    if (!newTopic.trim()) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setShowNewModal(false);

      const created = await copilotService.createSession(
        {
          topic: newTopic.trim(),
          title: newTopic.trim(),
          domain: newDomain,
          user_level: newUserLevel,
          skills: newSkills.split(',').map((s) => s.trim()).filter(Boolean),
          resources: newResources,
        },
        userId
      );

      setSessions((prev) => [created, ...prev]);
      await loadSessionDetails(created.id);
      setNewTopic('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start new research session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend = null, stageOverride = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !activeSession || isLoading) return;

    const targetStage = stageOverride !== null ? stageOverride : selectedStageOverride;

    // Optimistically push user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      stage: targetStage || currentStage,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setSelectedStageOverride(null);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await copilotService.chat(
        {
          session_id: activeSession.id,
          message: text,
          stage: targetStage,
          options: {},
        },
        userId
      );

      // Reload fresh session details from server
      await loadSessionDetails(activeSession.id);
    } catch (err) {
      setErrorMsg(err.message || 'Error executing copilot step.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIdea = async (ideaId) => {
    if (!activeSession || isLoading) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await copilotService.selectIdea(activeSession.id, ideaId, '', userId);
      await loadSessionDetails(activeSession.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to select idea');
    } finally {
      setIsLoading(false);
    }
  };

  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState(null);

  const handleDownloadIdeasPDF = () => {
    if (!activeSession) return;
    try {
      const result = exportCopilotIdeasAssessmentPDF({
        session: activeSession,
        ideas,
        projectPlan,
        messages,
      });
      setDownloadSuccessMsg(`Downloaded & opened assessment PDF: ${result.filename}`);
      setTimeout(() => setDownloadSuccessMsg(null), 6000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setErrorMsg(`Failed to generate Ideas Assessment PDF: ${err.message}`);
    }
  };

  const handleExportToReports = () => {
    if (activeSession) {
      saveSessionToLocalCache({
        ...activeSession,
        messages,
        ideas,
        project_plan: projectPlan,
      });
      navigate('/reports');
    }
  };

  const handleDownloadJSON = () => {
    if (!activeSession) return;
    const payload = {
      session: activeSession,
      messages,
      ideas,
      project_plan: projectPlan,
      exported_at: new Date().toISOString(),
    };
    const filename = `copilot-research-${activeSession.id.slice(0, 8)}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 60000);
  };

  return (
    <EnterpriseLayout activeModule="copilot">
      <div className="copilot-container">
        {/* Top Control Header */}
        <header className="copilot-topbar">
          <div className="copilot-topbar-left">
            <div className="copilot-brand-icon">
              <CopilotRobot size="sm" isThinking={isLoading} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="copilot-title">Research Discovery & Innovation Copilot</h1>
                <span className="copilot-badge-live">STAGE {currentStage} OF 5</span>
              </div>
              <p className="copilot-subtitle">
                {activeSession ? (
                  <>
                    Active Topic: <strong className="text-indigo-600">{activeSession.topic}</strong> &bull; Level:{' '}
                    <span className="text-emerald-600 font-semibold">{activeSession.user_level}</span> &bull; Domain:{' '}
                    <span className="text-cyan-700">{activeSession.domain}</span>
                  </>
                ) : (
                  'AI Research Companion & Formulation Engine'
                )}
              </p>
            </div>
          </div>

          <div className="copilot-topbar-actions">
            <button
              onClick={() => setShowNewModal(true)}
              className="copilot-btn-primary"
            >
              <Plus size={16} />
              <span>New Topic</span>
            </button>

            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="copilot-btn-secondary"
              title="Saved Sessions"
            >
              <FolderOpen size={16} />
              <span>Sessions ({sessions.length})</span>
            </button>

            <button
              onClick={handleDownloadIdeasPDF}
              disabled={!activeSession}
              className="copilot-btn-accent"
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                color: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(220, 38, 38, 0.28)',
                fontWeight: 700,
              }}
              title="Download and view formatted Research Ideas Assessment PDF"
              id="download-ideas-pdf-top"
            >
              <FileText size={16} />
              <span>Download Ideas PDF</span>
            </button>

            <button
              onClick={handleExportToReports}
              className="copilot-btn-accent"
              title="Send research dossier to Reports & Export Module"
            >
              <Award size={16} />
              <span>Export to Reports</span>
            </button>

            <button
              onClick={() => setShowFlightDeck(!showFlightDeck)}
              className={`copilot-btn-icon ${showFlightDeck ? 'active' : ''}`}
              title="Toggle Research Flight Deck"
            >
              <Sliders size={18} />
            </button>
          </div>
        </header>

        {downloadSuccessMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{downloadSuccessMsg}</span>
            </div>
            <button onClick={() => setDownloadSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stage Journey Stepper Bar */}
        <nav className="copilot-stepper">
          {STAGE_CONFIG.map((stage) => {
            const Icon = stage.icon;
            const isCompleted = currentStage > stage.id;
            const isActive = currentStage === stage.id;

            return (
              <button
                key={stage.id}
                onClick={() => {
                  if (activeSession) {
                    handleSendMessage(`Transition to ${stage.title}`, stage.id);
                  }
                }}
                className={`copilot-step-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="step-pill-icon">
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div className="step-pill-content">
                  <span className="step-pill-num">Step {stage.id}</span>
                  <span className="step-pill-title">{stage.title}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Main Body Layout */}
        <div className="copilot-workspace">
          {/* Conversation Stream (Center) */}
          <main className="copilot-chat-pane">
            {errorMsg && (
              <div className="copilot-alert-box mb-4">
                <ShieldAlert size={18} className="text-rose-500" />
                <span>{typeof errorMsg === 'string' ? errorMsg : (errorMsg?.detail || errorMsg?.message || 'Notice: Unable to complete request.')}</span>
                <button onClick={() => setErrorMsg(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            )}

            {messages.length === 0 && !isLoading && (
              <div className="copilot-hero-wrapper">
                <CopilotRobot size="lg" isThinking={isLoading} />
                <h2 className="copilot-hero-title">Meet Your Research Discovery & Innovation Copilot</h2>
                <p className="copilot-hero-subtitle">
                  An intelligent companion that guides you from beginner intuition to state-of-the-art literature exploration,
                  identifies high-impact research gaps, brainstorms candidate ideas, and formulates an actionable research blueprint.
                </p>
                <div className="copilot-quick-topics">
                  <button
                    onClick={() => launchDirectTopic('Neuromorphic Edge Computing for Real-Time Bio-signal Processing', 'Artificial Intelligence')}
                    className="copilot-chip"
                    disabled={isLoading}
                  >
                    ⚡ Neuromorphic Bio-signals
                  </button>
                  <button
                    onClick={() => launchDirectTopic('Multi-Agent LLMs for Automated Scientific Hypothesis Generation', 'Artificial Intelligence')}
                    className="copilot-chip"
                    disabled={isLoading}
                  >
                    🤖 Multi-Agent LLMs
                  </button>
                  <button
                    onClick={() => launchDirectTopic('Solid-State Electrolytes for High-Density Grid Energy Storage', 'Renewable Energy')}
                    className="copilot-chip"
                    disabled={isLoading}
                  >
                    🔋 Solid-State Batteries
                  </button>
                </div>
              </div>
            )}

            <div className="copilot-message-list">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className={`copilot-msg-bubble ${msg.sender}`}>
                  <div className="msg-avatar">
                    {msg.sender === 'assistant' ? (
                      <CopilotRobot size="sm" isThinking={false} />
                    ) : (
                      <div className="user-dot" />
                    )}
                  </div>

                  <div className="msg-body">
                    <div className="msg-meta">
                      <span className="msg-author">{msg.sender === 'assistant' ? 'Copilot Intelligence' : 'Researcher'}</span>
                      {msg.stage && (
                        <span className="msg-stage-tag">Stage {msg.stage}: {STAGE_CONFIG[msg.stage - 1]?.title}</span>
                      )}
                      <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Standard Text Content */}
                    <div className="msg-text-content">{msg.content}</div>

                    {/* Specialized Stage Cards */}
                    {msg.sender === 'assistant' && msg.stage_data && (
                      <div className="msg-stage-renderers mt-4">
                        {/* STAGE 1: Concept & Glossary */}
                        {msg.stage === 1 && renderStage1Card(msg.stage_data)}

                        {/* STAGE 2: Real Papers */}
                        {msg.stage === 2 && renderStage2Card(msg.stage_data)}

                        {/* STAGE 3: Gap Matrix */}
                        {msg.stage === 3 && renderStage3Card(msg.stage_data)}

                        {/* STAGE 4: Candidate Ideas */}
                        {msg.stage === 4 && renderStage4Card(msg.stage_data, ideas, handleSelectIdea, isLoading, handleDownloadIdeasPDF)}

                        {/* STAGE 5: Project Blueprint */}
                        {msg.stage === 5 && renderStage5Card(msg.stage_data || projectPlan, handleDownloadIdeasPDF)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="copilot-msg-bubble assistant loading">
                  <div className="msg-avatar">
                    <CopilotRobot size="sm" isThinking={true} />
                  </div>
                  <div className="msg-body">
                    <div className="msg-loading-indicator flex items-center gap-2">
                      <span className="font-semibold text-indigo-600">
                        Copilot is searching real academic providers & synthesizing evidence...
                      </span>
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Follow-up Suggestion Chips */}
            <div className="copilot-suggestion-bar">
              <span className="suggestion-label">Suggested next steps:</span>
              <button
                onClick={() => handleSendMessage('Search for the most cited recent papers and summarize their findings', 2)}
                className="suggestion-chip"
                disabled={isLoading}
              >
                🔬 Discover Real Papers (Stage 2)
              </button>
              <button
                onClick={() => handleSendMessage('Perform comparative gap analysis to find what remains unsolved', 3)}
                className="suggestion-chip"
                disabled={isLoading}
              >
                🧩 Map Unsolved Gaps (Stage 3)
              </button>
              <button
                onClick={() => handleSendMessage('Suggest concrete, high-feasibility research ideas for my profile', 4)}
                className="suggestion-chip"
                disabled={isLoading}
              >
                💡 Brainstorm Candidate Ideas (Stage 4)
              </button>
              <button
                onClick={() => handleSendMessage('Explain this in simpler terms with another everyday analogy')}
                className="suggestion-chip"
                disabled={isLoading}
              >
                👶 Explain More Simply
              </button>
            </div>

            {/* Input Bar */}
            <div className="copilot-input-dock">
              <div className="copilot-input-wrapper">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a question, request deeper analysis, or transition stages (e.g. 'Show me what benchmarks are standard')..."
                  rows={2}
                  disabled={isLoading || !activeSession}
                />

                <div className="copilot-input-footer">
                  <div className="stage-override-select">
                    <label>Force Stage:</label>
                    <select
                      value={selectedStageOverride || ''}
                      onChange={(e) => setSelectedStageOverride(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Auto Detect</option>
                      <option value="1">Stage 1: Concept</option>
                      <option value="2">Stage 2: Papers</option>
                      <option value="3">Stage 3: Gaps</option>
                      <option value="4">Stage 4: Ideas</option>
                      <option value="5">Stage 5: Blueprint</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading || !activeSession}
                    className="copilot-send-btn"
                  >
                    <span>Send</span>
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Right Research Flight Deck */}
          {showFlightDeck && (
            <aside className="copilot-flight-deck">
              <div className="flight-deck-header">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-cyan-400" />
                  <h3 className="flight-deck-title">Research Flight Deck</h3>
                </div>
                <button onClick={() => setShowFlightDeck(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {activeSession ? (
                <div className="flight-deck-content">
                  {/* Research Profile Box */}
                  <div className="flight-deck-card">
                    <div className="card-title-row">
                      <Target size={15} className="text-indigo-400" />
                      <span>Research Context</span>
                    </div>
                    <div className="flight-deck-kv">
                      <span className="label">Topic:</span>
                      <span className="value truncate text-cyan-300" title={activeSession.topic}>
                        {activeSession.topic}
                      </span>
                    </div>
                    <div className="flight-deck-kv">
                      <span className="label">Domain:</span>
                      <span className="value">{activeSession.domain}</span>
                    </div>
                    <div className="flight-deck-kv">
                      <span className="label">User Level:</span>
                      <span className="value font-semibold text-emerald-400">{activeSession.user_level}</span>
                    </div>
                    {activeSession.skills && activeSession.skills.length > 0 && (
                      <div className="flight-deck-tags mt-2">
                        {activeSession.skills.map((s, i) => (
                          <span key={i} className="skill-pill">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Candidate Ideas Tracker */}
                  <div className="flight-deck-card">
                    <div className="card-title-row">
                      <Lightbulb size={15} className="text-amber-400" />
                      <span>Evaluated Ideas ({ideas.length})</span>
                    </div>
                    {ideas.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">
                        No ideas formulated yet. Proceed to Stage 4 to brainstorm candidate directions.
                      </p>
                    ) : (
                      <>
                        <div className="deck-ideas-list">
                          {ideas.map((idea) => (
                            <div
                              key={idea.id}
                              className={`deck-idea-item ${idea.is_selected ? 'selected' : ''}`}
                              onClick={() => handleSelectIdea(idea.id)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="idea-item-title truncate">{idea.title}</span>
                                {idea.is_selected && <span className="selected-tag">Selected</span>}
                              </div>
                              <div className="idea-scores-compact mt-1">
                                <span>Relevance: {idea.relevance_score}%</span> &bull;{' '}
                                <span>Feas: {idea.feasibility_score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleDownloadIdeasPDF}
                          className="w-full mt-2.5 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                          title="Download complete PDF evaluating and scoring these research ideas"
                          id="download-ideas-pdf-deck"
                        >
                          <FileText size={13} />
                          <span>Download Ideas Assessment (PDF)</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Active Blueprint Summary */}
                  {projectPlan && (
                    <div className="flight-deck-card blueprint-highlight">
                      <div className="card-title-row">
                        <Award size={15} className="text-emerald-400" />
                        <span>Active Project Blueprint</span>
                      </div>
                      <h4 className="blueprint-deck-title">{projectPlan.project_title}</h4>
                      <p className="blueprint-deck-sub">{projectPlan.objectives?.length || 0} Core Milestones Defined</p>
                      <button
                        onClick={handleDownloadIdeasPDF}
                        className="w-full mt-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                        title="Download and view complete Blueprint & Ideas assessment in PDF"
                      >
                        <FileText size={13} />
                        <span>Download Blueprint & Ideas PDF</span>
                      </button>
                      <button
                        onClick={handleExportToReports}
                        className="w-full mt-2 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <FileText size={14} />
                        <span>Export Full Blueprint to Reports</span>
                      </button>
                    </div>
                  )}

                  {/* Quick Export Actions */}
                  <div className="flight-deck-card">
                    <div className="card-title-row">
                      <Share2 size={15} className="text-cyan-400" />
                      <span>Dossier Actions</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <button onClick={handleDownloadIdeasPDF} className="action-btn-row font-bold text-red-600 hover:text-red-700">
                        <FileText size={14} className="text-red-600" />
                        <span>Download Ideas Assessment (PDF)</span>
                      </button>
                      <button onClick={handleExportToReports} className="action-btn-row">
                        <FileText size={14} className="text-cyan-400" />
                        <span>View in Reports Module</span>
                      </button>
                      <button onClick={handleDownloadJSON} className="action-btn-row">
                        <Download size={14} className="text-emerald-400" />
                        <span>Download Raw JSON Dossier</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center text-center gap-3">
                  <CopilotRobot size="md" isThinking={isLoading} />
                  <span className="text-xs font-bold text-slate-700">Research Companion Active</span>
                  <p className="text-xs text-slate-500">
                    Launch a new topic or select a session to view live research metrics.
                  </p>
                </div>
              )}
            </aside>
          )}
        </div>

        {/* New Session Modal */}
        {showNewModal && (
          <div className="copilot-modal-overlay">
            <div className="copilot-modal-card">
              <div className="modal-header">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-cyan-400" />
                  <h3 className="modal-title">Initialize Research Discovery Journey</h3>
                </div>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="modal-body space-y-4">
                <div>
                  <label className="input-label">What research problem or topic do you want to explore? *</label>
                  <textarea
                    required
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Neuromorphic edge computing for low-power biomedical telemetry..."
                    rows={3}
                    className="modal-textarea"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Domain</label>
                    <select
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="modal-select"
                    >
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Biotechnology & Healthcare">Biotechnology & Healthcare</option>
                      <option value="Quantum Computing">Quantum Computing</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                      <option value="Robotics & Autonomous Systems">Robotics & Autonomous Systems</option>
                      <option value="Semiconductors & Materials">Semiconductors & Materials</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Your Prior Knowledge Level</label>
                    <select
                      value={newUserLevel}
                      onChange={(e) => setNewUserLevel(e.target.value)}
                      className="modal-select"
                    >
                      <option value="Beginner">Beginner (No prior background, explain with analogies)</option>
                      <option value="Intermediate">Intermediate (Familiar with core concepts)</option>
                      <option value="Advanced">Advanced (Researcher, focus on state-of-the-art gaps)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Your Skills & Background (comma-separated)</label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="Python, PyTorch, Linear Algebra, Signal Processing"
                    className="modal-input"
                  />
                </div>

                <div>
                  <label className="input-label">Available Resources / Constraints</label>
                  <input
                    type="text"
                    value={newResources}
                    onChange={(e) => setNewResources(e.target.value)}
                    placeholder="1 GPU, 6 months part-time, budget $5,000"
                    className="modal-input"
                  />
                </div>

                <div className="modal-footer pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="copilot-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTopic.trim() || isLoading}
                    className="copilot-btn-primary flex items-center gap-1.5"
                  >
                    <Sparkles size={16} />
                    <span>Launch Research Discovery</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sessions History Drawer */}
        {showHistoryDrawer && (
          <div className="copilot-drawer-overlay" onClick={() => setShowHistoryDrawer(false)}>
            <div className="copilot-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div className="flex items-center gap-2">
                  <FolderOpen size={18} className="text-cyan-400" />
                  <h3 className="drawer-title">Previous Research Sessions</h3>
                </div>
                <button onClick={() => setShowHistoryDrawer(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-body">
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No saved research sessions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          loadSessionDetails(s.id);
                          setShowHistoryDrawer(false);
                        }}
                        className={`drawer-session-card ${activeSession?.id === s.id ? 'active' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="session-card-title truncate">{s.title || s.topic}</span>
                          <span className="session-stage-badge">Stage {s.current_stage}/5</span>
                        </div>
                        <p className="session-card-desc line-clamp-2 mt-1">{s.topic}</p>
                        <div className="session-card-footer mt-2">
                          <span>{s.domain}</span> &bull; <span>{s.user_level}</span> &bull;{' '}
                          <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EnterpriseLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// STAGE-SPECIFIC CARD RENDERERS
// ─────────────────────────────────────────────────────────────

function renderStage1Card(data) {
  if (!data) return null;
  const { concepts = [], analogy = '', key_terms = [] } = data;

  return (
    <div className="stage-card stage-1-card">
      <div className="stage-card-header">
        <BookOpen size={18} className="text-cyan-400" />
        <h4 className="stage-card-title">Foundational Concept Breakdown</h4>
      </div>

      {analogy && (
        <div className="analogy-banner">
          <div className="analogy-icon">💡</div>
          <div className="analogy-text">
            <strong>Everyday Analogy:</strong> {analogy}
          </div>
        </div>
      )}

      {concepts.length > 0 && (
        <div className="concepts-grid mt-3">
          {concepts.map((c, i) => (
            <div key={i} className="concept-box">
              <h5 className="concept-term">{c.term || c.name}</h5>
              <p className="concept-def">{c.simple_explanation || c.definition}</p>
            </div>
          ))}
        </div>
      )}

      {key_terms.length > 0 && (
        <div className="key-terms-row mt-3">
          <span className="terms-label">Core Glossary:</span>
          {key_terms.map((t, i) => (
            <span key={i} className="term-badge">
              {typeof t === 'string' ? t : t.term}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function renderStage2Card(data) {
  if (!data) return null;
  const { papers = [], search_query = '', count = 0 } = data;

  return (
    <div className="stage-card stage-2-card">
      <div className="stage-card-header">
        <FileText size={18} className="text-indigo-400" />
        <div className="flex-1">
          <h4 className="stage-card-title">Real Literature Evidence ({papers.length} Papers Retrieved)</h4>
          <span className="stage-card-sub">Queried across OpenAlex, Semantic Scholar & Crossref</span>
        </div>
      </div>

      <div className="papers-grid mt-3">
        {papers.map((p, i) => (
          <div key={p.id || i} className="paper-card">
            <div className="paper-header">
              <span className="paper-index">#{i + 1}</span>
              <h5 className="paper-title">{p.title}</h5>
            </div>

            <div className="paper-meta">
              <span className="paper-authors truncate">
                {Array.isArray(p.authors)
                  ? p.authors.map((a) => (typeof a === 'string' ? a : a.name)).slice(0, 3).join(', ')
                  : 'Scholarly Authors'}
              </span>
              <span>&bull;</span>
              <span>{p.publication_year || p.year || '2025'}</span>
              <span>&bull;</span>
              <span className="citations-badge">{p.citation_count || p.citations_count || 0} citations</span>
            </div>

            {p.research_problem && (
              <div className="paper-section">
                <span className="sec-label">Problem:</span>
                <span className="sec-val">{p.research_problem}</span>
              </div>
            )}

            {p.methodology && (
              <div className="paper-section">
                <span className="sec-label">Method:</span>
                <span className="sec-val">{p.methodology}</span>
              </div>
            )}

            {p.findings && (
              <div className="paper-section">
                <span className="sec-label">Key Finding:</span>
                <span className="sec-val">{p.findings}</span>
              </div>
            )}

            {p.limitations && (
              <div className="paper-section limitations">
                <span className="sec-label text-rose-400">Limitation:</span>
                <span className="sec-val text-rose-300">{p.limitations}</span>
              </div>
            )}

            <div className="paper-footer">
              <span className="paper-source-tag">{p.source || 'OpenAlex'}</span>
              {(p.paper_url || p.doi) && (
                <a
                  href={p.paper_url || `https://doi.org/${p.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="paper-link-btn"
                >
                  <span>DOI / Source</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStage3Card(data) {
  if (!data) return null;
  const { gap_matrix = [], overarching_limitations = [] } = data;

  return (
    <div className="stage-card stage-3-card">
      <div className="stage-card-header">
        <HelpCircle size={18} className="text-amber-400" />
        <h4 className="stage-card-title">Comparative Research Gap Matrix</h4>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="gap-matrix-table">
          <thead>
            <tr>
              <th>Research Aspect</th>
              <th>Current State-of-the-Art Solved</th>
              <th>Critical Unresolved Gap</th>
              <th>Limitation Evidence</th>
            </tr>
          </thead>
          <tbody>
            {gap_matrix.map((row, i) => (
              <tr key={i}>
                <td className="font-semibold text-white">{row.aspect || row.subtopic}</td>
                <td className="text-emerald-300">{row.solved_aspects || row.current_capability}</td>
                <td className="text-amber-300 font-medium">{row.unsolved_gap || row.remaining_challenge}</td>
                <td className="text-slate-400 text-xs">{row.evidence_limitation || row.citation_evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overarching_limitations.length > 0 && (
        <div className="mt-4 p-3 rounded bg-amber-950/20 border border-amber-800/40">
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            Synthesized Field Constraints:
          </span>
          <ul className="list-disc list-inside text-xs text-amber-200/90 mt-1 space-y-1">
            {overarching_limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderStage4Card(data, ideasList, onSelectIdea, isLoading, onDownloadPDF) {
  const candidates = data?.ideas || ideasList || [];
  if (candidates.length === 0) return null;

  return (
    <div className="stage-card stage-4-card">
      <div className="stage-card-header flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Lightbulb size={18} className="text-yellow-400" />
          <div>
            <h4 className="stage-card-title">Candidate Research Ideas & Feasibility Scoring</h4>
            <span className="stage-card-sub">Select one idea to generate an actionable project blueprint</span>
          </div>
        </div>
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition"
            title="Download formatted Ideas Assessment in PDF"
            id="download-ideas-pdf-card"
          >
            <FileText size={13} />
            <span>Download Assessment PDF</span>
          </button>
        )}
      </div>

      <div className="ideas-grid mt-3">
        {candidates.map((idea, i) => (
          <div key={idea.id || i} className={`idea-card ${idea.is_selected ? 'selected' : ''}`}>
            <div className="idea-card-header">
              <span className="idea-num">Option {i + 1}</span>
              <h5 className="idea-title">{idea.title}</h5>
            </div>

            <p className="idea-rq">
              <strong>Research Question:</strong> {idea.research_question}
            </p>

            <div className="idea-gauges-row">
              <div className="gauge-box">
                <span className="gauge-val text-cyan-400">{idea.relevance_score || 85}%</span>
                <span className="gauge-lbl">Relevance</span>
              </div>
              <div className="gauge-box">
                <span className="gauge-val text-emerald-400">{idea.feasibility_score || 80}%</span>
                <span className="gauge-lbl">Feasibility</span>
              </div>
            </div>

            {idea.novelty_argument && (
              <div className="idea-detail-item">
                <span className="item-lbl text-yellow-400">Novelty Evidence:</span>
                <p className="item-val">{idea.novelty_argument}</p>
              </div>
            )}

            {idea.risks && (
              <div className="idea-detail-item">
                <span className="item-lbl text-rose-400">Technical Risks:</span>
                <p className="item-val text-rose-300">{idea.risks}</p>
              </div>
            )}

            <button
              onClick={() => onSelectIdea(idea.id)}
              disabled={isLoading || idea.is_selected}
              className={`select-idea-btn ${idea.is_selected ? 'selected' : ''}`}
            >
              {idea.is_selected ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>Selected & Formulated</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>Select & Build Project Blueprint</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStage5Card(data, onDownloadPDF) {
  if (!data) return null;
  const {
    project_title,
    objectives = [],
    methodology = '',
    datasets = [],
    metrics = [],
    milestones = [],
    funding_synergies = [],
    patent_synergies = [],
  } = data;

  return (
    <div className="stage-card stage-5-card">
      <div className="stage-card-header flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Compass size={18} className="text-emerald-400" />
          <div>
            <h4 className="stage-card-title">Structured Research Project Blueprint</h4>
            <span className="stage-card-sub">{project_title}</span>
          </div>
        </div>
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition"
            title="Download full Blueprint & Ideas Assessment in PDF"
            id="download-blueprint-pdf-card"
          >
            <FileText size={13} />
            <span>Download Assessment PDF</span>
          </button>
        )}
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <div className="blueprint-section">
          <h5 className="blueprint-sec-heading flex items-center gap-1.5">
            <Target size={15} className="text-cyan-400" />
            <span>Core Research Objectives</span>
          </h5>
          <ol className="blueprint-ordered-list">
            {objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Methodology */}
      {methodology && (
        <div className="blueprint-section">
          <h5 className="blueprint-sec-heading flex items-center gap-1.5">
            <Layers size={15} className="text-indigo-400" />
            <span>Proposed Methodology & System Architecture</span>
          </h5>
          <p className="blueprint-text">{methodology}</p>
        </div>
      )}

      {/* Datasets & Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 my-3">
        {datasets.length > 0 && (
          <div className="blueprint-sub-box">
            <h6 className="sub-box-title flex items-center gap-1.5">
              <Database size={14} className="text-amber-400" />
              <span>Benchmark Datasets</span>
            </h6>
            <ul className="sub-box-list">
              {datasets.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {metrics.length > 0 && (
          <div className="blueprint-sub-box">
            <h6 className="sub-box-title flex items-center gap-1.5">
              <BarChart2 size={14} className="text-emerald-400" />
              <span>Evaluation Metrics</span>
            </h6>
            <ul className="sub-box-list">
              {metrics.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 6-Month Roadmap Milestones */}
      {milestones.length > 0 && (
        <div className="blueprint-section">
          <h5 className="blueprint-sec-heading flex items-center gap-1.5">
            <Calendar size={15} className="text-violet-400" />
            <span>6-Month Execution Milestones</span>
          </h5>
          <div className="milestones-timeline">
            {milestones.map((m, i) => (
              <div key={i} className="timeline-node">
                <div className="node-marker">{i + 1}</div>
                <div className="node-content">
                  <span className="node-period">{m.period || `Month ${i * 2 + 1}-${i * 2 + 2}`}</span>
                  <h6 className="node-title">{m.milestone || m.deliverable || m.task}</h6>
                  {m.deliverables && <p className="node-desc">{m.deliverables}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Module Synergies */}
      {(funding_synergies.length > 0 || patent_synergies.length > 0) && (
        <div className="synergies-grid mt-4">
          {funding_synergies.length > 0 && (
            <div className="synergy-card funding">
              <span className="synergy-title">💰 Module 4: Funding Opportunities</span>
              <ul className="synergy-list">
                {funding_synergies.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {patent_synergies.length > 0 && (
            <div className="synergy-card patent">
              <span className="synergy-title">🛡️ Module 5: Patent Landscape</span>
              <ul className="synergy-list">
                {patent_synergies.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
