/**
 * Dashboard API Service
 * Consolidates intelligence from Modules 3-8 into role-specific data payloads.
 * Supports: Researcher, Startup Founder, Innovation Manager, and Administrator.
 */

export async function getDashboardData(userId, role, domainFilter = "All", timeRange = "5Y") {
  // Simulating async backend API delay
  await new Promise((r) => setTimeout(r, 120));

  const userRole = (role || 'researcher').toLowerCase();

  // 1. RESEARCHER DATA (Modules 3, 4, 5, 7)
  const researcherData = {
    summary: {
      "Total Publications": "1,250",
      "Active Funding Matches": "14 Grants",
      "Relevant Patents": "1,240",
      "Avg Citation Count": "14.7 / paper",
      "Innovation Score": "78 / 100"
    },
    research_trends: [
      { year: "2022", publications: 100, citations: 420 },
      { year: "2023", publications: 180, citations: 890 },
      { year: "2024", publications: 300, citations: 1650 },
      { year: "2025", publications: 520, citations: 2900 },
      { year: "2026", publications: 850, citations: 4800 }
    ],
    trending_topics: [
      { topic: "Multimodal Foundation Models", growth: "+148%", papers: 340 },
      { topic: "Self-Supervised Medical Vision", growth: "+92%", papers: 215 },
      { topic: "Edge Neural Compression", growth: "+64%", papers: 180 },
      { topic: "Federated Clinical Intelligence", growth: "+45%", papers: 115 }
    ],
    publication_analytics: {
      total_pubs: 1250,
      total_citations: 18420,
      h_index: 48,
      domains: [
        { domain: "Medical Computer Vision", count: 480, percentage: 38 },
        { domain: "Generative Intelligence", count: 350, percentage: 28 },
        { domain: "Edge Embedded AI", count: 240, percentage: 19 },
        { domain: "Bio-signal Processing", count: 180, percentage: 15 }
      ]
    },
    funding_opportunities: [
      { 
        id: "grant-01",
        title: "AI Healthcare Translational Grant",
        org: "National Science Foundation (NSF)",
        amount: "$1,500,000",
        deadline: "18 Days left",
        eligibility: "Principal Investigators with prior R01/R21 or equivalent peer-reviewed AI publications.",
        match: "96%",
        domain: "Medical Imaging / AI"
      },
      { 
        id: "grant-02",
        title: "Medical Innovation & Diagnostics Fund",
        org: "National Institutes of Health (NIH)",
        amount: "$750,000",
        deadline: "29 Days left",
        eligibility: "Academic researchers, hospitals, and clinical AI development teams.",
        match: "91%",
        domain: "Clinical Oncology"
      },
      { 
        id: "grant-03",
        title: "Advanced Computing Seed Accelerator",
        org: "DARPA & University Research Board",
        amount: "$350,000",
        deadline: "42 Days left",
        eligibility: "Open to novel algorithmic neural architectures and low-power inference models.",
        match: "87%",
        domain: "Edge Computing"
      }
    ],
    patent_insights: {
      total: 1240,
      trend: "Accelerating (+38% YoY)",
      top_areas: ["Neural Network Architectures", "Medical Image Classification", "Transformer Attention Models"],
      top_assignees: ["Google LLC (184)", "Siemens Healthineers (142)", "IBM Corp (115)", "Philips Healthcare (88)"],
      timeline: [
        { year: "2022", patents: 120 },
        { year: "2023", patents: 210 },
        { year: "2024", patents: 390 },
        { year: "2025", patents: 640 },
        { year: "2026", patents: 920 }
      ]
    },
    innovation_score: {
      total: 78,
      status: "High Commercial Viability",
      factors: [
        { name: "Research Novelty", value: 85, weight: 30, desc: "Significant deviation from prior art with high citation velocity." },
        { name: "Patent Strength", value: 72, weight: 20, desc: "Strong claims breadth across US and EPO jurisdictions." },
        { name: "Technology Maturity (TRL)", value: 68, weight: 15, desc: "Demonstrated prototype in operational environment (TRL 5-6)." },
        { name: "Market Potential", value: 80, weight: 20, desc: "Rapidly expanding TAM in healthcare AI diagnosis." },
        { name: "Funding Relevance", value: 88, weight: 15, desc: "Direct alignment with 3 high-probability active grant calls." }
      ]
    },
    actionable_insights: [
      "Your research in multimodal imaging matches the upcoming NSF AI Healthcare call closing in 18 days.",
      "Patent filings by Siemens and Philips in your domain surged 38% this quarter; early defensive publication recommended.",
      "Novelty score is in the top 8% of indexed AI medical papers this academic cycle."
    ]
  };

  // 2. STARTUP FOUNDER DATA (Modules 4, 5, 6, 8)
  const startupData = {
    summary: {
      "Available Non-Dilutive Capital": "$4.8M",
      "High-Growth Tech Vectors": "4 Tracked",
      "Competitor Patent Filings": "38 Active",
      "Commercial Readiness (TRL)": "TRL 6",
      "Spin-off Opportunity Score": "84 / 100"
    },
    funding_opportunities: [
      {
        id: "start-f1",
        title: "NSF SBIR Phase I: DeepTech AI Commercialization",
        org: "National Science Foundation",
        amount: "$275,000",
        deadline: "24 Days left",
        eligibility: "Early-stage US tech spin-offs < 500 employees. Focus on deep technological innovation.",
        match: "98%",
        type: "Non-dilutive Grant"
      },
      {
        id: "start-f2",
        title: "Techstars HealthTech Accelerator Cohort",
        org: "Techstars & Horizon Ventures",
        amount: "$120,000 + $400K Follow-on",
        deadline: "35 Days left",
        eligibility: "Early stage B2B enterprise healthcare software with clinical validation underway.",
        match: "93%",
        type: "Accelerator / Equity"
      },
      {
        id: "start-f3",
        title: "Regional Innovation Commercialization Fund",
        org: "State Economic Development Board",
        amount: "$500,000",
        deadline: "60 Days left",
        eligibility: "University spin-offs transitioning research IP into commercial prototypes.",
        match: "89%",
        type: "Matching Grant"
      }
    ],
    technology_opportunities: [
      {
        name: "Generative AI for Enterprise Diagnosis",
        research_growth: "Very High (+140%)",
        patent_growth: "Rapid (+88%)",
        adoption: "Developing (Early Enterprise Pilots)",
        opportunity: "AI-based enterprise workflow automation replacing manual diagnostic triage.",
        competitors: "Tempus, PathAI, Aidoc"
      },
      {
        name: "Edge AI Medical Computer Vision",
        research_growth: "High (+85%)",
        patent_growth: "Moderate (+42%)",
        adoption: "Accelerating (Hardware integrations)",
        opportunity: "Embedded low-latency inference on portable hospital bedside scanners.",
        competitors: "NVIDIA Clara, Butterfly Network"
      },
      {
        name: "Federated Privacy-Preserving Learning",
        research_growth: "Moderate (+45%)",
        patent_growth: "Steady (+28%)",
        adoption: "Early Stage (Regulatory Sandbox)",
        opportunity: "Multi-hospital collaborative training without patient data centralization.",
        competitors: "Owkin, Rhino Health"
      }
    ],
    patent_intelligence: {
      total_competitor_patents: 418,
      freedom_to_operate: "Moderate - White space identified in real-time edge calibration",
      competitor_activity: [
        { assignee: "Siemens Healthineers", filed_2025: 42, focus: "Cloud Diagnostic Pipelines", risk: "Medium" },
        { assignee: "Philips Healthcare", filed_2025: 31, focus: "Ultrasound Neural Filters", risk: "Low" },
        { assignee: "GE Healthcare", filed_2025: 29, focus: "MRI Reconstruction Algorithms", risk: "Medium" },
        { assignee: "Emerging Startups", filed_2025: 58, focus: "Edge Vision & Automated Triage", risk: "High" }
      ],
      top_patent_domains: ["G06T (Image Data Processing)", "G16H (Healthcare Informatics)", "G06N (Neural Networks)"]
    },
    commercialization_insights: [
      {
        path: "Productization (B2B SaaS / API)",
        desc: "Package multimodal diagnostic models as a cloud API integrating with hospital PACS/DICOM systems.",
        evidence: "Hospital pilot feedback showed 42% reduction in initial radiological triage backlog.",
        confidence: 88,
        timeframe: "3 - 6 Months"
      },
      {
        path: "Direct IP Licensing",
        desc: "Non-exclusive licensing of proprietary edge inference models to imaging hardware OEMs.",
        evidence: "High patent claims density in edge compression with zero active OEM prior art.",
        confidence: 76,
        timeframe: "6 - 12 Months"
      },
      {
        path: "Spin-off Venture Creation",
        desc: "Incorporate dedicated spin-off targeting venture capital round led by HealthTech seed syndicates.",
        evidence: "Proven unit economics in diagnostic clinics with 3 signed Letters of Intent (LOIs).",
        confidence: 82,
        timeframe: "Immediate"
      },
      {
        path: "Industry Consortium Partnership",
        desc: "Co-development agreement with tier-1 pharmaceutical company for clinical trial patient stratification.",
        evidence: "Pre-clinical validation published in IEEE Transactions with high reproducibility score.",
        confidence: 71,
        timeframe: "9 - 15 Months"
      }
    ],
    actionable_insights: [
      "White space exists in embedded edge inference; competitors are currently focused almost exclusively on heavy cloud pipelines.",
      "NSF SBIR Phase I deadline is in 24 days; non-dilutive $275k provides runway to finalize TRL-7 validation.",
      "3 signed enterprise LOIs satisfy commercialization milestones for Seed syndicate evaluations."
    ]
  };

  // 3. INNOVATION MANAGER DATA (Portfolio, Pipeline, Trends, Funding)
  const managerData = {
    summary: {
      "Tracked Research Projects": "16 Portfolio",
      "Avg Innovation Index": "77.4 / 100",
      "Total Active Pipeline Value": "$24.6M",
      "Technologies Evaluated": "38 Assessed",
      "Commercialized IP": "4 Assets"
    },
    pipeline: [
      { stage: "Research Idea", count: 18, color: "#3B82F6", desc: "Initial literature discovery & thesis formulation" },
      { stage: "Technology Assessment", count: 12, color: "#6366F1", desc: "TRL 3-4 validation & experimental benchmarking" },
      { stage: "Evaluation & FTO", count: 9, color: "#8B5CF6", desc: "Prior art search, novelty & freedom-to-operate" },
      { stage: "Innovation Scoring", count: 6, color: "#D97706", desc: "Composite scoring across 5 weighted dimensions" },
      { stage: "Commercialization", count: 4, color: "#10B981", desc: "Licensing agreements, spin-offs & industry pilots" }
    ],
    portfolio_projects: [
      { id: "P-101", name: "Project NeuroVision", lead: "Dr. A. Sharma", domain: "Artificial Intelligence", score: 84, stage: "Commercialization", maturity: "TRL 7", funding: "$1.2M Secured" },
      { id: "P-102", name: "BioSensing Microfluidics", lead: "Dr. K. Patel", domain: "Biotechnology", score: 79, stage: "Innovation Scoring", maturity: "TRL 5", funding: "$650K Pending" },
      { id: "P-103", name: "Quantum Annealing for Logistics", lead: "Prof. H. Chen", domain: "Quantum Computing", score: 68, stage: "Evaluation & FTO", maturity: "TRL 3", funding: "$400K Grant" },
      { id: "P-104", name: "Solid-State Battery Electrolytes", lead: "Dr. M. Roberts", domain: "Clean Energy", score: 88, stage: "Commercialization", maturity: "TRL 6", funding: "$2.4M Industry" },
      { id: "P-105", name: "Edge Neuromorphic Sensor", lead: "Dr. R. Nair", domain: "Semiconductors", score: 72, stage: "Technology Assessment", maturity: "TRL 4", funding: "$300K Internal" }
    ],
    technology_trends: [
      { technology: "Generative Foundation Models", trend: "Rapidly Emerging", direction: "↑", growth: "+135%", maturity: "Developing", commercialActivity: "High" },
      { technology: "Quantum Error Mitigation", trend: "Emerging", direction: "↑", growth: "+82%", maturity: "Early Stage", commercialActivity: "Moderate" },
      { technology: "Neuromorphic AI Accelerators", trend: "Accelerating", direction: "↑", growth: "+94%", maturity: "Developing", commercialActivity: "High" },
      { technology: "Distributed Ledger Provenance", trend: "Stabilized", direction: "→", growth: "+8%", maturity: "Mature", commercialActivity: "Low" },
      { technology: "Traditional Monolithic Cloud", trend: "Declining Growth", direction: "↓", growth: "-14%", maturity: "Commoditized", commercialActivity: "Saturated" }
    ],
    funding_analytics: {
      total_available: "$38.2M",
      domain_breakdown: [
        { domain: "Artificial Intelligence & Robotics", amount: 14.8, percentage: 39 },
        { domain: "Clean Tech & Renewable Storage", amount: 11.2, percentage: 29 },
        { domain: "Biomedical & Life Sciences", amount: 8.4, percentage: 22 },
        { domain: "Quantum & Advanced Computing", amount: 3.8, percentage: 10 }
      ],
      upcoming_calls: [
        { program: "Horizon Europe Cluster 4: Digital, Industry & Space", grantPool: "€1.2B", deadline: "45 Days", relevance: "High" },
        { program: "US Department of Energy ARPA-E Clean Innovation", grantPool: "$45M", deadline: "60 Days", relevance: "Very High" },
        { program: "National Quantum Initiative Strategic Call", grantPool: "$28M", deadline: "75 Days", relevance: "Medium" }
      ]
    },
    actionable_insights: [
      "Project Solid-State Battery (TRL 6, Score 88) qualifies for ARPA-E $45M consortium grant.",
      "Innovation pipeline throughput increased by 22% following automated Module 7 scoring integration.",
      "Recommend advancing Project NeuroVision to formal licensing negotiations with Siemens Healthineers."
    ]
  };

  // 4. ADMIN DASHBOARD DATA (Platform Analytics, User Management, Reports)
  const adminData = {
    summary: {
      "Total Registered Users": "1,480",
      "Active Daily Users": "842",
      "Total Searches Executed": "32,840",
      "Recommendations Generated": "41,200",
      "System Operational Uptime": "99.98%"
    },
    user_management: {
      by_role: [
        { role: "Researchers", count: 820, percentage: 55, color: "#1D4ED8" },
        { role: "Startup Founders", count: 340, percentage: 23, color: "#047857" },
        { role: "Innovation Managers", count: 260, percentage: 18, color: "#8B5CF6" },
        { role: "System Administrators", count: 60, percentage: 4, color: "#D97706" }
      ],
      recent_users: [
        { id: "U-849", name: "Dr. Elena Vance", email: "elena.vance@stanford.edu", role: "Researcher", org: "Stanford University", lastActive: "4 mins ago", status: "Active" },
        { id: "U-850", name: "Marcus Thorne", email: "m.thorne@deepnexus.ai", role: "Startup Founder", org: "DeepNexus AI", lastActive: "18 mins ago", status: "Active" },
        { id: "U-851", name: "Sarah Jenkins", email: "sjenkins@techtransfer.org", role: "Innovation Manager", org: "Imperial TTO", lastActive: "1 hour ago", status: "Active" },
        { id: "U-852", name: "Devon Clark", email: "admin.clark@infointel.gov", role: "Administrator", org: "Internal SecOps", lastActive: "Just now", status: "Active" }
      ]
    },
    platform_analytics: {
      search_activity: [
        { category: "Research Literature Searches (Mod 3)", count: 14250, pct: 43 },
        { category: "Patent Landscape Inquiries (Mod 5)", count: 9140, pct: 28 },
        { category: "Funding Match Queries (Mod 4)", count: 5820, pct: 18 },
        { category: "Technology Trend Forecasts (Mod 6)", count: 3630, pct: 11 }
      ],
      timeline: [
        { day: "Mon", searches: 4200, recommendations: 5600 },
        { day: "Tue", searches: 5100, recommendations: 6800 },
        { day: "Wed", searches: 6200, recommendations: 8100 },
        { day: "Thu", searches: 5900, recommendations: 7900 },
        { day: "Fri", searches: 6800, recommendations: 8900 },
        { day: "Sat", searches: 2400, recommendations: 3100 },
        { day: "Sun", searches: 2240, recommendations: 2800 }
      ]
    },
    recommendation_monitoring: {
      total_served: 41200,
      breakdown: [
        { type: "Funding Grant Matches", generated: 16800, ctr: "32.4%", avgScore: "88%" },
        { type: "Patent White-Space Alerts", generated: 11200, ctr: "28.1%", avgScore: "76%" },
        { type: "Technology Forecast Alerts", generated: 8400, ctr: "24.6%", avgScore: "81%" },
        { type: "Commercialization Pathways", generated: 4800, ctr: "38.9%", avgScore: "84%" }
      ]
    },
    system_reports: {
      api_latency: "38 ms (p95: 72 ms)",
      database_status: "Healthy (PostgreSQL Pool: 14/50 active)",
      cache_hit_rate: "94.2% (Redis in-memory)",
      worker_queue: "Idle (0 pending background tasks)",
      modules_connected: ["Module 3 (Research)", "Module 4 (Funding)", "Module 5 (Patents)", "Module 6 (Technology)", "Module 7 (Innovation)", "Module 8 (Commercial)"]
    },
    actionable_insights: [
      "Platform search volume peaked Wednesday following new NSF call indexing.",
      "Redis query caching reduced average API latency from 140ms to 38ms.",
      "All 6 upstream intelligence module workers are online and synced."
    ]
  };

  // Determine which payload to return based on active role
  let rolePayload = researcherData;
  if (userRole.includes('startup')) {
    rolePayload = startupData;
  } else if (userRole.includes('manager')) {
    rolePayload = managerData;
  } else if (userRole.includes('admin')) {
    rolePayload = adminData;
  }

  return {
    status: 'success',
    role: userRole,
    domain: domainFilter,
    timeRange: timeRange,
    timestamp: new Date().toISOString(),
    data: {
      ...rolePayload,
      role: userRole
    }
  };
}
