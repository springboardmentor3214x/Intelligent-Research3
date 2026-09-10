import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useResearchProfile } from "../../hooks/useResearchProfile";
import fundingService from "../../services/fundingService";
import { Bell, CheckCircle2, Calendar, FileKey, Award, BookOpen, RefreshCw } from "lucide-react";

export default function NotificationsPage() {
  const { profile, completion } = useResearchProfile();
  const [fundingAlerts, setFundingAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fundingService.getFunding({ page: 1, page_size: 3, is_active: true })
      .then((res) => {
        const items = res?.items || [];
        setFundingAlerts(items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const alerts = [
    ...fundingAlerts.map((f) => ({
      title: `${f.title} (Deadline: ${f.close_date || "Approaching"})`,
      time: "Active Call",
      type: "Grant Opportunity",
      icon: <Calendar size={16} className="text-blue" />,
      link: `/funding/${f.id}`
    })),
    ...(profile?.publications?.slice(0, 2).map((p) => ({
      title: `Indexed publication: "${p.title}" (${p.citationCount || 0} citations)`,
      time: p.publicationDate || "Recent",
      type: "Scholarly Record",
      icon: <BookOpen size={16} className="text-blue" />,
      link: "/research-profile"
    })) || []),
    ...(profile?.patents?.slice(0, 2).map((pt) => ({
      title: `Registered IP: "${pt.title}" (${pt.patentNumber || "Pending"})`,
      time: pt.filingDate || "Active",
      type: "Patent Status",
      icon: <FileKey size={16} className="text-amber" />,
      link: "/patent-intel"
    })) || []),
    {
      title: `Profile completion is currently at ${completion.percentage}%`,
      time: "Live System",
      type: "Profile Intelligence",
      icon: <Award size={16} className="text-amber" />,
      link: "/research-profile"
    }
  ];

  return (
    <DashboardLayout pageTitle="Notifications & Alert System" breadcrumbs={["Platform", "Module 10", "Notifications"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Notification & Alert System</h3>
            <p className="tab-section-desc">Automated alerts for active grant deadlines, patent status, and profile updates.</p>
          </div>
        </div>

        {loading ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "40px" }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: "#2563eb", margin: "0 auto 8px" }} />
            <p style={{ margin: 0, color: "#64748b" }}>Loading live notifications...</p>
          </div>
        ) : (
          <div className="publications-stream">
            {alerts.map((a, idx) => (
              <div key={idx} className="publication-entry-card" style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {a.icon}
                    <div>
                      <h4 style={{ margin: "0 0 2px", fontSize: "0.9rem", color: "#0f172a" }}>{a.title}</h4>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>{a.type} • {a.time}</span>
                    </div>
                  </div>
                  <Link to={a.link} className="badge-pub-type type-journal" style={{ textDecoration: "none" }}>
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}