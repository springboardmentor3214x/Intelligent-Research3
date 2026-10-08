import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import ScoringDashboardHome from './ScoringDashboardHome';
import NewAssessmentView from './NewAssessmentView';
import ScoreDetailsView from './ScoreDetailsView';
import ResearchImpactView from './ResearchImpactView';
import TechnologyReadinessView from './TechnologyReadinessView';
import CommercialViabilityView from './CommercialViabilityView';
import FundingAttractivenessView from './FundingAttractivenessView';
import CompareInnovationsView from './CompareInnovationsView';

import {
  Award,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  Cpu,
  Briefcase,
  DollarSign,
  Scale,
} from 'lucide-react';

export default function InnovationDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preloadedTechId = searchParams.get('techId');

  const [currentView, setCurrentView] = useState(preloadedTechId ? 'new' : 'dashboard');

  useEffect(() => {
    if (preloadedTechId) {
      setCurrentView('new');
    }
  }, [preloadedTechId]);

  const TABS = [
    { id: 'dashboard', label: 'Scoring Dashboard', icon: Award },
    { id: 'new', label: 'New Assessment', icon: Sparkles },
    { id: 'details', label: 'Score Details', icon: FileSpreadsheet },
    { id: 'impact', label: 'Research Impact', icon: TrendingUp },
    { id: 'readiness', label: 'Technology Readiness', icon: Cpu },
    { id: 'viability', label: 'Commercial Viability', icon: Briefcase },
    { id: 'funding', label: 'Funding Attractiveness', icon: DollarSign },
    { id: 'compare', label: 'Compare Innovations', icon: Scale },
  ];

  const handleCommercialize = (innovationId) => {
    navigate(`/commercialization?innovationId=${innovationId}`);
  };

  const handleNavigateToModule6 = (techId) => {
    navigate('/technology');
  };

  const getViewBreadcrumb = () => {
    const found = TABS.find((t) => t.id === currentView);
    return found ? [found.label] : ['Scoring Dashboard'];
  };

  return (
    <EnterpriseLayout
      activeModule="innovation"
      moduleTitle="Innovation Scoring Engine"
      activeView={currentView}
      onViewChange={setCurrentView}
      tabs={TABS}
      breadcrumbs={getViewBreadcrumb()}
    >
      {currentView === 'dashboard' && (
        <ScoringDashboardHome
          onNewAssessment={() => setCurrentView('new')}
          onCommercialize={handleCommercialize}
        />
      )}

      {currentView === 'new' && (
        <NewAssessmentView
          preloadedTechId={preloadedTechId}
          onAssessmentComplete={() => setCurrentView('details')}
        />
      )}

      {currentView === 'details' && (
        <ScoreDetailsView onCommercialize={handleCommercialize} />
      )}

      {currentView === 'impact' && <ResearchImpactView />}

      {currentView === 'readiness' && (
        <TechnologyReadinessView onNavigateToModule6={handleNavigateToModule6} />
      )}

      {currentView === 'viability' && (
        <CommercialViabilityView onCommercialize={handleCommercialize} />
      )}

      {currentView === 'funding' && <FundingAttractivenessView />}

      {currentView === 'compare' && (
        <CompareInnovationsView onCommercialize={handleCommercialize} />
      )}
    </EnterpriseLayout>
  );
}
