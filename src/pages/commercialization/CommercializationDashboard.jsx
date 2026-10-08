import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import CommercializationHome from './CommercializationHome';
import ResearchAnalysisView from './ResearchAnalysisView';
import ProductizationView from './ProductizationView';
import LicensingView from './LicensingView';
import StartupOpportunityView from './StartupOpportunityView';
import IndustryPartnershipsView from './IndustryPartnershipsView';
import RecommendationDetailsView from './RecommendationDetailsView';

import {
  Rocket,
  Layers,
  Package,
  FileCheck,
  Briefcase,
  Building2,
  FileText,
} from 'lucide-react';

export default function CommercializationDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const innovationId = searchParams.get('innovationId') || 'inno-multi-agent-robotics';

  const [currentView, setCurrentView] = useState('dashboard');

  const TABS = [
    { id: 'dashboard', label: 'Commercialization Dashboard', icon: Rocket },
    { id: 'analysis', label: 'Research Analysis', icon: Layers },
    { id: 'productization', label: 'Productization', icon: Package },
    { id: 'licensing', label: 'Licensing', icon: FileCheck },
    { id: 'startup', label: 'Startup Opportunity', icon: Briefcase },
    { id: 'partnerships', label: 'Industry Partnerships', icon: Building2 },
    { id: 'recommendations', label: 'Recommendation Details', icon: FileText },
  ];

  const getViewBreadcrumb = () => {
    const found = TABS.find((t) => t.id === currentView);
    return found ? [found.label] : ['Commercialization Dashboard'];
  };

  return (
    <EnterpriseLayout
      activeModule="commercialization"
      moduleTitle="Commercialization Intelligence"
      activeView={currentView}
      onViewChange={setCurrentView}
      tabs={TABS}
      breadcrumbs={getViewBreadcrumb()}
    >
      {currentView === 'dashboard' && (
        <CommercializationHome
          innovationId={innovationId}
          onSelectPathway={(pathwayId) => setCurrentView(pathwayId)}
          onViewRecommendations={() => setCurrentView('recommendations')}
        />
      )}

      {currentView === 'analysis' && (
        <ResearchAnalysisView innovationId={innovationId} />
      )}

      {currentView === 'productization' && (
        <ProductizationView innovationId={innovationId} />
      )}

      {currentView === 'licensing' && (
        <LicensingView
          innovationId={innovationId}
          onNavigateToPatent={() => navigate('/patents')}
        />
      )}

      {currentView === 'startup' && (
        <StartupOpportunityView innovationId={innovationId} />
      )}

      {currentView === 'partnerships' && (
        <IndustryPartnershipsView innovationId={innovationId} />
      )}

      {currentView === 'recommendations' && (
        <RecommendationDetailsView innovationId={innovationId} />
      )}
    </EnterpriseLayout>
  );
}
