import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import TechDashboardHome from './TechDashboardHome';
import EmergingTechView from './EmergingTechView';
import TechExplorerView from './TechExplorerView';
import MaturityAnalysisView from './MaturityAnalysisView';
import AdoptionTrackingView from './AdoptionTrackingView';
import InnovationOpportunitiesView from './InnovationOpportunitiesView';
import CompetitiveMonitoringView from './CompetitiveMonitoringView';

import {
  LayoutDashboard,
  Cpu,
  Search,
  Activity,
  TrendingUp,
  Lightbulb,
  Building2,
} from 'lucide-react';

export default function TechnologyDashboard() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTechId, setSelectedTechId] = useState('tech-ai-agents');
  const navigate = useNavigate();

  const TABS = [
    { id: 'dashboard', label: 'Technology Dashboard', icon: LayoutDashboard },
    { id: 'emerging', label: 'Emerging Technologies', icon: Cpu },
    { id: 'explorer', label: 'Technology Explorer', icon: Search },
    { id: 'maturity', label: 'Maturity Analysis', icon: Activity },
    { id: 'adoption', label: 'Adoption Tracking', icon: TrendingUp },
    { id: 'opportunities', label: 'Innovation Opportunities', icon: Lightbulb },
    { id: 'competitive', label: 'Competitive Monitoring', icon: Building2 },
  ];

  const handleSelectTechnology = (id) => {
    setSelectedTechId(id);
    setCurrentView('explorer');
  };

  const handleAssessInModule7 = (id) => {
    navigate(`/innovation?techId=${id}`);
  };

  const getViewBreadcrumb = () => {
    const found = TABS.find((t) => t.id === currentView);
    return found ? [found.label] : ['Dashboard'];
  };

  return (
    <EnterpriseLayout
      activeModule="technology"
      moduleTitle="Technology Intelligence"
      activeView={currentView}
      onViewChange={setCurrentView}
      tabs={TABS}
      breadcrumbs={getViewBreadcrumb()}
    >
      {currentView === 'dashboard' && (
        <TechDashboardHome
          onSelectTechnology={handleSelectTechnology}
          onViewAllEmerging={() => setCurrentView('emerging')}
          onAssessInnovation={handleAssessInModule7}
        />
      )}

      {currentView === 'emerging' && (
        <EmergingTechView onSelectTechnology={handleSelectTechnology} />
      )}

      {currentView === 'explorer' && (
        <TechExplorerView
          technologyId={selectedTechId}
          onBack={() => setCurrentView('dashboard')}
          onAssessInModule7={handleAssessInModule7}
        />
      )}

      {currentView === 'maturity' && (
        <MaturityAnalysisView onSelectTechnology={handleSelectTechnology} />
      )}

      {currentView === 'adoption' && <AdoptionTrackingView />}

      {currentView === 'opportunities' && (
        <InnovationOpportunitiesView onSelectTechnology={handleSelectTechnology} />
      )}

      {currentView === 'competitive' && <CompetitiveMonitoringView />}
    </EnterpriseLayout>
  );
}
