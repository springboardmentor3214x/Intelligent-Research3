import React, { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileCompletion from "../components/profile/ProfileCompletion";
import ProfileOverviewTab from "../components/profile/ProfileOverviewTab";
import BasicInformationTab from "../components/profile/BasicInformationTab";
import OrganizationTab from "../components/profile/OrganizationTab";
import ResearchInformationTab from "../components/profile/ResearchInformationTab";
import KeywordManager from "../components/profile/KeywordManager";
import TechnologyManager from "../components/profile/TechnologyManager";
import ResearchHistoryTab from "../components/profile/ResearchHistoryTab";
import PublicationList from "../components/publications/PublicationList";
import PatentList from "../components/patents/PatentList";
import Toast from "../components/common/Toast";
import { useResearchProfile } from "../hooks/useResearchProfile";
import {
  LayoutDashboard,
  User,
  Building2,
  Sparkles,
  Tag,
  Cpu,
  BookOpen,
  FileKey,
  Briefcase,
  RefreshCw
} from "lucide-react";
import "../components/profile/ResearchProfile.css";

export default function ResearchProfile() {
  const {
    profile,
    loading,
    completion,
    expertise,
    updateSection,
    updateKeywords,
    addTechnology,
    updateTechnology,
    deleteTechnology,
    addPublication,
    updatePublication,
    deletePublication,
    addPatent,
    updatePatent,
    deletePatent,
    addHistory,
    updateHistory,
    deleteHistory
  } = useResearchProfile();

  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type, id: Date.now() });
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} /> },
    { id: "basic", label: "Basic Info", icon: <User size={15} /> },
    { id: "organization", label: "Organization", icon: <Building2 size={15} /> },
    { id: "research", label: "Research Focus", icon: <Sparkles size={15} /> },
    { id: "keywords", label: "Keywords", icon: <Tag size={15} /> },
    { id: "technologies", label: "Technologies", icon: <Cpu size={15} /> },
    { id: "publications", label: "Publications", icon: <BookOpen size={15} /> },
    { id: "patents", label: "Patents", icon: <FileKey size={15} /> },
    { id: "history", label: "Experience", icon: <Briefcase size={15} /> }
  ];

  if (loading && !profile) {
    return (
      <DashboardLayout pageTitle="Research Profile" breadcrumbs={["Research Intelligence", "Research Profile"]}>
        <div className="empty-state-panel" style={{ minHeight: "400px" }}>
          <RefreshCw size={36} className="empty-state-icon animate-spin" />
          <h4 className="empty-state-title">Loading Research Profile...</h4>
          <p className="empty-state-text">Fetching verified academic credentials and intelligence records.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="Research Profile Management"
      breadcrumbs={["Research Intelligence", "Module 2", "Research Profile"]}
    >
      <div className="research-profile-page">
        {/* ── Top Profile Summary Header ── */}
        <ProfileHeader
          profile={profile}
          completion={completion}
          onEditClick={() => setActiveTab("basic")}
        />

        {/* ── Profile Completion Checklist (Shown on Overview & Basic) ── */}
        {(activeTab === "overview" || activeTab === "basic") && (
          <ProfileCompletion
            completion={completion}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ── Navigation Tabs Bar ── */}
        <div className="profile-tabs-nav" role="tablist" aria-label="Profile Sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`profile-tab-btn ${activeTab === t.id ? "tab-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Active Tab Panes ── */}
        <div className="profile-tab-body">
          {activeTab === "overview" && (
            <ProfileOverviewTab
              profile={profile}
              expertise={expertise}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "basic" && (
            <BasicInformationTab
              profile={profile}
              onSave={updateSection}
              onToast={showToast}
            />
          )}

          {activeTab === "organization" && (
            <OrganizationTab
              profile={profile}
              onSave={updateSection}
              onToast={showToast}
            />
          )}

          {activeTab === "research" && (
            <ResearchInformationTab
              profile={profile}
              onSave={updateSection}
              onToast={showToast}
            />
          )}

          {activeTab === "keywords" && (
            <KeywordManager
              profile={profile}
              onSaveKeywords={updateKeywords}
              onToast={showToast}
            />
          )}

          {activeTab === "technologies" && (
            <TechnologyManager
              technologies={profile?.technologies || []}
              onAddTechnology={addTechnology}
              onUpdateTechnology={updateTechnology}
              onDeleteTechnology={deleteTechnology}
              onToast={showToast}
            />
          )}

          {activeTab === "publications" && (
            <PublicationList
              publications={profile?.publications || []}
              onAddPublication={addPublication}
              onUpdatePublication={updatePublication}
              onDeletePublication={deletePublication}
              onToast={showToast}
            />
          )}

          {activeTab === "patents" && (
            <PatentList
              patents={profile?.patents || []}
              onAddPatent={addPatent}
              onUpdatePatent={updatePatent}
              onDeletePatent={deletePatent}
              onToast={showToast}
            />
          )}

          {activeTab === "history" && (
            <ResearchHistoryTab
              history={profile?.researchHistory || []}
              onAddHistory={addHistory}
              onUpdateHistory={updateHistory}
              onDeleteHistory={deleteHistory}
              onToast={showToast}
            />
          )}
        </div>
      </div>

      {/* ── Global Toast ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </DashboardLayout>
  );
}