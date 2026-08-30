import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Bell, CheckCircle2, Calendar, FileKey, Award, BookOpen } from "lucide-react";

export default function NotificationsPage() {
  const alerts = [
    { title: "NSF Grant Call Approaching Deadline (15 Days)", time: "2 hours ago", type: "Grant Deadline", icon: <Calendar size={16} className="text-blue" /> },
    { title: "New Forward Citation on 'Interpretable Deep Learning'", time: "1 day ago", type: "Citation Alert", icon: <BookOpen size={16} className="text-blue" /> },
    { title: "Patent US-11948201-B2 Status Confirmed as Granted", time: "3 days ago", type: "Patent Status", icon: <FileKey size={16} className="text-amber" /> },
    { title: "Quarterly Profile Strength Score Increased to 91%", time: "1 week ago", type: "System Score", icon: <Award size={16} className="text-amber" /> }
  ];

  return (
    <DashboardLayout pageTitle="Notifications & Alert System" breadcrumbs={["Research Intelligence", "Module 10", "Notifications"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Notification & Alert System</h3>
            <p className="tab-section-desc">Automated alerts for grant deadlines, patent status updates, and citation spikes.</p>
          </div>
        </div>

        <div className="publications-stream">
          {alerts.map((a) => (
            <div key={a.title} className="publication-entry-card" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {a.icon}
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.9rem", color: "#0f172a" }}>{a.title}</h4>
                    <span style={{ fontSize: "0.74rem", color: "#64748b" }}>{a.type} • {a.time}</span>
                  </div>
                </div>
                <span className="badge-pub-type type-journal">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}