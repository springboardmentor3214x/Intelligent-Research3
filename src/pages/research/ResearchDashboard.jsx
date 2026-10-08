import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import DashboardHome from './DashboardHome';
import PapersView from './PapersView';
import ResearchSearch from './ResearchSearch';
import ResearchTrends from './ResearchTrends';
import ResearchInsights from './ResearchInsights';
import SavedPapersPage from './SavedPapersPage';
import PaperDetailsModal from '../../components/research/PaperDetailsModal';
import ProfileSetupPage from './ProfileSetupPage';
import { getSavedPapers, savePaperToStorage, removeSavedPaperFromStorage } from '../../services/researchService';
import { LayoutDashboard, FileText, Search, TrendingUp, Sparkles, Bookmark } from 'lucide-react';
import '../../styles/research.css';

export default function ResearchDashboard() {
  const { user, profile } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [savedPapers, setSavedPapers] = useState([]);
  const [activeModalPaper, setActiveModalPaper] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState('details');

  // Profile completion gate — shows Module 2 profile setup if role or domain is missing
  const isProfileIncomplete = !profile?.role || !profile?.researchDomain;
  const [showProfileSetup, setShowProfileSetup] = useState(isProfileIncomplete);

  // Load saved papers on mount
  useEffect(() => {
    const loadSaved = async () => {
      const papers = await getSavedPapers(user?.id);
      setSavedPapers(papers);
    };
    loadSaved();
  }, [user]);

  const handleToggleSave = async (paper) => {
    const isAlreadySaved = savedPapers.some(
      (p) => p.id === paper.id || p.external_id === paper.external_id
    );

    if (isAlreadySaved) {
      const updated = await removeSavedPaperFromStorage(user?.id, paper.id || paper.external_id);
      setSavedPapers(updated);
    } else {
      const updated = await savePaperToStorage(user?.id, paper);
      setSavedPapers(updated);
    }
  };

  const handleRemoveSaved = async (paperId) => {
    const updated = await removeSavedPaperFromStorage(user?.id, paperId);
    setSavedPapers(updated);
  };

  const handleSelectPaper = (paper) => {
    setModalInitialTab('details');
    setActiveModalPaper(paper);
  };

  const handleOpenAiSummary = (paper) => {
    setModalInitialTab('ai');
    setActiveModalPaper(paper);
  };

  const savedPaperIds = new Set(savedPapers.map((p) => p.id || p.external_id));

  const TABS = [
    { id: 'dashboard', label: 'Research Overview', icon: LayoutDashboard, description: 'Aggregated analytics and publications metrics' },
    { id: 'papers', label: 'Research Papers', icon: FileText, description: 'Live papers feed from OpenAlex and Semantic Scholar' },
    { id: 'search', label: 'Multi-Source Search', icon: Search, description: 'Deep literature search with AI synthesis' },
    { id: 'trends', label: 'Research Trends', icon: TrendingUp, description: 'Emerging topics, velocity, and citation forecasting' },
    { id: 'insights', label: 'AI Synthesis & Insights', icon: Sparkles, description: 'Automated gap analysis and cross-domain synthesis' },
    { id: 'saved', label: 'Saved Library', icon: Bookmark, count: savedPapers.length, description: 'Bookmarked papers for offline and grant references' },
  ];

  return (
    <EnterpriseLayout
      activeModule="research"
      moduleTitle="Research Intelligence"
      activeView={currentView}
      onViewChange={setCurrentView}
      tabs={TABS}
    >
      {currentView === 'dashboard' && (
        <DashboardHome
          onSelectPaper={handleSelectPaper}
          onOpenAiSummary={handleOpenAiSummary}
          onToggleSave={handleToggleSave}
          savedPaperIds={savedPaperIds}
        />
      )}

      {currentView === 'papers' && (
        <PapersView
          onSelectPaper={handleSelectPaper}
          onOpenAiSummary={handleOpenAiSummary}
          onToggleSave={handleToggleSave}
          savedPaperIds={savedPaperIds}
        />
      )}

      {currentView === 'search' && (
        <ResearchSearch
          onSelectPaper={handleSelectPaper}
          onOpenAiSummary={handleOpenAiSummary}
          onToggleSave={handleToggleSave}
          savedPaperIds={savedPaperIds}
        />
      )}

      {currentView === 'trends' && <ResearchTrends />}

      {currentView === 'insights' && <ResearchInsights />}

      {currentView === 'saved' && (
        <SavedPapersPage
          savedPapers={savedPapers}
          onSelectPaper={handleSelectPaper}
          onOpenAiSummary={handleOpenAiSummary}
          onRemoveSaved={handleRemoveSaved}
        />
      )}

      {/* Paper Details & AI Analysis Modal */}
      {activeModalPaper && (
        <PaperDetailsModal
          paper={activeModalPaper}
          initialTab={modalInitialTab}
          onClose={() => setActiveModalPaper(null)}
          onToggleSave={handleToggleSave}
          isSaved={savedPaperIds.has(activeModalPaper.id) || savedPaperIds.has(activeModalPaper.external_id)}
          userId={user?.id}
        />
      )}

      {/* Module 2 Profile Completion Gate */}
      {showProfileSetup && (
        <ProfileSetupPage
          isModal
          onComplete={() => setShowProfileSetup(false)}
        />
      )}
    </EnterpriseLayout>
  );
}

