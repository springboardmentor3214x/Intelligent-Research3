import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import FundingDashboardHome from './FundingDashboardHome';
import FundingSearch from './FundingSearch';
import RecommendedFunding from './RecommendedFunding';
import SavedFundingPage from './SavedFundingPage';
import DeadlineTracker from './DeadlineTracker';
import FundingComparison from './FundingComparison';
import FundingDetailsModal from '../../components/funding/FundingDetailsModal';
import { getSavedFunding, saveFundingToStorage, removeSavedFundingFromStorage } from '../../services/fundingService';
import { LayoutDashboard, Search, Sparkles, Clock, Scale, Bookmark } from 'lucide-react';
import '../../styles/funding.css';

export default function FundingDashboard() {
  const { user, profile } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [savedFunding, setSavedFunding] = useState([]);
  const [activeModalOpp, setActiveModalOpp] = useState(null);

  useEffect(() => {
    const loadSaved = async () => {
      const opps = await getSavedFunding(user?.id);
      setSavedFunding(opps);
    };
    loadSaved();
  }, [user]);

  const handleToggleSave = async (opp) => {
    const isAlreadySaved = savedFunding.some(
      (f) => f.id === opp.id || f.external_id === opp.external_id
    );

    if (isAlreadySaved) {
      const updated = await removeSavedFundingFromStorage(user?.id, opp.id || opp.external_id);
      setSavedFunding(updated);
    } else {
      const updated = await saveFundingToStorage(user?.id, opp);
      setSavedFunding(updated);
    }
  };

  const handleRemoveSaved = async (oppId) => {
    const updated = await removeSavedFundingFromStorage(user?.id, oppId);
    setSavedFunding(updated);
  };

  const handleSelectDetails = (opp) => {
    setActiveModalOpp(opp);
  };

  const savedOppIds = new Set(savedFunding.map((f) => f.id || f.external_id));

  const TABS = [
    { id: 'dashboard', label: 'Funding Overview', icon: LayoutDashboard, description: 'Aggregated grant volume, deadlines, and agency distribution' },
    { id: 'search', label: 'Grant Search', icon: Search, description: 'Grants.gov API and international funding database search' },
    { id: 'recommended', label: 'Recommended Grants', icon: Sparkles, description: 'AI-matched grants tailored to your research profile' },
    { id: 'deadlines', label: 'Deadline Tracker', icon: Clock, description: 'Upcoming grant milestones and submission countdowns' },
    { id: 'comparison', label: 'Grant Comparison', icon: Scale, description: 'Side-by-side eligibility and budget breakdown' },
    { id: 'saved', label: 'Saved Grants', icon: Bookmark, count: savedFunding.length, description: 'Bookmarked grants portfolio and notes' },
  ];

  return (
    <EnterpriseLayout
      activeModule="funding"
      moduleTitle="Funding Intelligence"
      activeView={currentView}
      onViewChange={setCurrentView}
      tabs={TABS}
    >
      {currentView === 'dashboard' && (
        <FundingDashboardHome
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedOppIds={savedOppIds}
        />
      )}

      {currentView === 'search' && (
        <FundingSearch
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedOppIds={savedOppIds}
        />
      )}

      {currentView === 'recommended' && (
        <RecommendedFunding
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedOppIds={savedOppIds}
        />
      )}

      {currentView === 'deadlines' && (
        <DeadlineTracker
          onSelectDetails={handleSelectDetails}
          onToggleSave={handleToggleSave}
          savedOppIds={savedOppIds}
        />
      )}

      {currentView === 'comparison' && (
        <FundingComparison onSelectDetails={handleSelectDetails} />
      )}

      {currentView === 'saved' && (
        <SavedFundingPage
          savedFunding={savedFunding}
          onSelectDetails={handleSelectDetails}
          onRemoveSaved={handleRemoveSaved}
        />
      )}

      {/* Opportunity Details Modal */}
      {activeModalOpp && (
        <FundingDetailsModal
          opportunity={activeModalOpp}
          onClose={() => setActiveModalOpp(null)}
          onToggleSave={handleToggleSave}
          isSaved={savedOppIds.has(activeModalOpp.id) || savedOppIds.has(activeModalOpp.external_id)}
        />
      )}
    </EnterpriseLayout>
  );
}

