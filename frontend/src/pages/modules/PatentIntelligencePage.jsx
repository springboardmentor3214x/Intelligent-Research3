import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { patentService } from "../../services/patentService";
import PatentSearchSection from "../../components/patent-landscape/PatentSearchSection";
import PatentResultsSection from "../../components/patent-landscape/PatentResultsSection";
import PatentClusteringSection from "../../components/patent-landscape/PatentClusteringSection";
import PatentTrendsSection from "../../components/patent-landscape/PatentTrendsSection";
import PatentCompetitorsSection from "../../components/patent-landscape/PatentCompetitorsSection";
import InnovationMapSection from "../../components/patent-landscape/InnovationMapSection";
import PatentDetailModal from "../../components/patent-landscape/PatentDetailModal";
import "../../components/patent-landscape/PatentLandscape.css";

export default function PatentIntelligencePage() {
  // Search & Filter state
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [classification, setClassification] = useState("");
  const [yearMin, setYearMin] = useState(null);
  const [yearMax, setYearMax] = useState(null);
  const [sortBy, setSortBy] = useState("filing_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Data states
  const [searchResults, setSearchResults] = useState({ items: [], total: 0, total_pages: 1 });
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedPatent, setSelectedPatent] = useState(null);

  // Analytics states
  const [trendsData, setTrendsData] = useState({ trends: [], total_patents: 0 });
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendDomain, setTrendDomain] = useState("ALL");

  const [competitorsData, setCompetitorsData] = useState({ competitors: [], total_assignees: 0 });
  const [competitorsLoading, setCompetitorsLoading] = useState(false);

  const [innovationData, setInnovationData] = useState({ domains: [], total_patents: 0 });
  const [innovationLoading, setInnovationLoading] = useState(false);

  const [clusterData, setClusterData] = useState(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  // Sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);

  // Load available domains once
  useEffect(() => {
    patentService
      .getDomains()
      .then((res) => {
        if (Array.isArray(res)) setAvailableDomains(res);
      })
      .catch((err) => console.error("Failed to load domains:", err));
  }, []);

  // Fetch Search Results
  const fetchSearchResults = useCallback(async () => {
    setSearchLoading(true);
    try {
      const res = await patentService.searchPatents({
        q: query,
        assignee,
        domain,
        classification,
        year_min: yearMin,
        year_max: yearMax,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setSearchResults(res || { items: [], total: 0, total_pages: 1 });
    } catch (err) {
      console.error("Patent search error:", err);
      setSearchResults({ items: [], total: 0, total_pages: 1 });
    } finally {
      setSearchLoading(false);
    }
  }, [query, assignee, domain, classification, yearMin, yearMax, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Fetch Trends
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const res = await patentService.getTrends({ domain: trendDomain });
      setTrendsData(res || { trends: [], total_patents: 0 });
    } catch (err) {
      console.error("Patent trends error:", err);
      setTrendsData({ trends: [], total_patents: 0 });
    } finally {
      setTrendsLoading(false);
    }
  }, [trendDomain]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Fetch Competitors
  const fetchCompetitors = useCallback(async () => {
    setCompetitorsLoading(true);
    try {
      const res = await patentService.getCompetitors({ limit: 10 });
      setCompetitorsData(res || { competitors: [], total_assignees: 0 });
    } catch (err) {
      console.error("Competitors error:", err);
      setCompetitorsData({ competitors: [], total_assignees: 0 });
    } finally {
      setCompetitorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  // Fetch Innovation Map
  const fetchInnovationMap = useCallback(async () => {
    setInnovationLoading(true);
    try {
      const res = await patentService.getInnovationMap();
      setInnovationData(res || { domains: [], total_patents: 0 });
    } catch (err) {
      console.error("Innovation map error:", err);
      setInnovationData({ domains: [], total_patents: 0 });
    } finally {
      setInnovationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInnovationMap();
  }, [fetchInnovationMap]);

  // Run Clustering
  const handleRunClustering = async (nClusters = 4) => {
    setClusterLoading(true);
    try {
      const res = await patentService.clusterPatents({
        n_clusters: nClusters,
        domain_filter: domain !== "ALL" ? domain : null,
      });
      setClusterData(res);
    } catch (err) {
      console.error("Clustering error:", err);
    } finally {
      setClusterLoading(false);
    }
  };

  // Sync real patents from provider
  const handleSync = async (syncQuery, source) => {
    setSyncLoading(true);
    setSyncSummary(null);
    try {
      const res = await patentService.syncPatents({ query: syncQuery, source, limit: 25 });
      setSyncSummary(res);
      // Refresh all data
      fetchSearchResults();
      fetchTrends();
      fetchCompetitors();
      fetchInnovationMap();
      patentService.getDomains().then((d) => Array.isArray(d) && setAvailableDomains(d));
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncLoading(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setQuery("");
    setAssignee("");
    setDomain("ALL");
    setClassification("");
    setYearMin(null);
    setYearMax(null);
    setSortBy("filing_date");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <DashboardLayout
      pageTitle="Patent Landscape Analysis"
      breadcrumbs={["Intelligence Platform", "Module 5", "Patent Landscape"]}
    >
      <div className="patent-module-container">
        {/* SECTION 1: Patent Search & Ingestion */}
        <PatentSearchSection
          query={query}
          setQuery={setQuery}
          assignee={assignee}
          setAssignee={setAssignee}
          domain={domain}
          setDomain={setDomain}
          classification={classification}
          setClassification={setClassification}
          yearMin={yearMin}
          setYearMin={setYearMin}
          yearMax={yearMax}
          setYearMax={setYearMax}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          availableDomains={availableDomains}
          onSearch={() => setPage(1)}
          onReset={handleResetFilters}
          onSync={handleSync}
          syncLoading={syncLoading}
          syncSummary={syncSummary}
        />

        {/* SECTION 2: Patent Results */}
        <PatentResultsSection
          patents={searchResults.items}
          total={searchResults.total}
          page={page}
          pageSize={pageSize}
          totalPages={searchResults.total_pages}
          onPageChange={(p) => setPage(p)}
          onSelectPatent={(p) => setSelectedPatent(p)}
          loading={searchLoading}
        />

        {/* SECTION 3: Patent Clustering */}
        <PatentClusteringSection
          clusterData={clusterData}
          onRunClustering={handleRunClustering}
          loading={clusterLoading}
        />

        {/* SECTION 4: Patent Trend Analysis */}
        <PatentTrendsSection
          trends={trendsData.trends}
          totalPatents={trendsData.total_patents}
          domain={trendDomain}
          setDomain={setTrendDomain}
          availableDomains={availableDomains}
          loading={trendsLoading}
        />

        {/* SECTION 5: Competitor Patent Analysis */}
        <PatentCompetitorsSection
          competitors={competitorsData.competitors}
          loading={competitorsLoading}
        />

        {/* SECTION 6: Innovation Mapping */}
        <InnovationMapSection
          domains={innovationData.domains}
          totalPatents={innovationData.total_patents}
          loading={innovationLoading}
        />

        {/* Patent Detail Modal */}
        <PatentDetailModal
          patent={selectedPatent}
          onClose={() => setSelectedPatent(null)}
        />
      </div>
    </DashboardLayout>
  );
}