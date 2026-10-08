import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import PatentDashboardHome from './PatentDashboardHome';
import PatentSearch from './PatentSearch';
import PatentClustering from './PatentClustering';
import PatentTrends from './PatentTrends';
import CompetitorAnalysis from './CompetitorAnalysis';
import InnovationMapping from './InnovationMapping';
import SavedPatentsPage from './SavedPatentsPage';
import PatentDetailsModal from '../../components/patents/PatentDetailsModal';
import { getSavedPatents, savePatentToStorage, removeSavedPatentFromStorage } from '../../services/patentService';
import { LayoutDashboard, Search, Network, TrendingUp, Users, Compass, Bookmark } from 'lucide-react';
import '../../styles/patents.css';

export default function PatentDashboard() {
  const { user, profile } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [savedPatents, setSavedPatents] = useState([]);
  const [activeModalPatent, setActiveModalPatent] = useState(null);

  useEffect(() => {
    const loadSaved = async () => {
      const pats = await getSavedPatents(user?.id);
      setSavedPatents(pats);
    };
    loadSaved();
  }, [user]);

  const handleToggleSave = async (pat) => {
    const isAlreadySaved = savedPatents.some(
      (p) => p.id === pat.id || p.external_id === pat.external_id
    );

    if (isAlreadySaved) {
      const updated = await removeSavedPatentFromStorage(user?.id, pat.id || pat.external_id);
      setSavedPatents(updated);
    } else {
      const updated = await savePatentToStorage(user?.id, pat);
      setSavedPatents(updated);
    }
  };

  const handleRemoveSaved = async (patId) => {
    const updated = await removeSavedPatentFromStorage(user?.id, patId);
    setSavedPatents(updated);
  };

  const handleSelectDetails = (pat) => {
    setActiveModalPatent(pat);
  };

  const savedPatentIds = new Set(savedPatents.map((p) => p.id || p.external_id));

  const TABS = [
    { id: 'dashboard', label: 'Patent Overview', icon: LayoutDashboard, description: 'Global patent filings, top assignees, and technology classes' },
    { id: 'search', label: 'Patent Search', icon: Search, description: 'EPO OPS multi-jurisdiction patent search with claim analysis' },
    { id: 'clustering', label: 'IPC/CPC Clustering', icon: Network, description: 'Hierarchical patent classification clusters and white-space detection' },
    { id: 'trends', label: 'Patent Trends', icon: TrendingUp, description: 'Filing velocity, citation frequency, and geographical expansion' },
    { id: 'competitors', label: 'Competitor Analysis', icon: Users, description: 'Portfolio benchmarking against corporate and academic assignees' },
    { id: 'mapping', label: 'Innovation Mapping', icon: Compass, description: 'Interactive technology readiness and patent landscape map' },
    { id: 'saved', label: 'Saved Patents', icon: Bookmark, count: savedPatents.length, description: 'Bookmarked patent citations and prior-art repository' },
  ];

  return (
    <EnterpriseLayout
      activeModule="patents"
      moduleTitle="Patent Landscape"
      activeView={currentView}
      onViewChange={setCurrentView}
      tabs={TABS}
    >
      {currentView === 'dashboard' && (
        <PatentDashboardHome
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedPatentIds={savedPatentIds}
        />
      )}

      {currentView === 'search' && (
        <PatentSearch
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedPatentIds={savedPatentIds}
        />
      )}

      {currentView === 'clustering' && (
        <PatentClustering
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedPatentIds={savedPatentIds}
        />
      )}

      {currentView === 'trends' && <PatentTrends />}

      {currentView === 'competitors' && (
        <CompetitorAnalysis
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedPatentIds={savedPatentIds}
        />
      )}

      {currentView === 'mapping' && <InnovationMapping />}

      {currentView === 'saved' && (
        <SavedPatentsPage
          savedPatents={savedPatents}
          onSelectDetails={handleSelectDetails}
          onRemoveSaved={handleRemoveSaved}
        />
      )}

      {/* Patent Details Modal */}
      {activeModalPatent && (
        <PatentDetailsModal
          patent={activeModalPatent}
          onClose={() => setActiveModalPatent(null)}
          onToggleSave={handleToggleSave}
          isSaved={savedPatentIds.has(activeModalPatent.id) || savedPatentIds.has(activeModalPatent.external_id)}
        />
      )}
    </EnterpriseLayout>
  );
}

