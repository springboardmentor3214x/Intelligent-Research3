import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  TrendingUp,
  Search,
  FileKey,
  Cpu,
  Award,
  DollarSign,
  Bell,
  FileText,
  Sparkles,
  ChevronRight,
  BarChart2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "Administrator";

  const navSections = [
    {
      label: "OVERVIEW",
      items: [
        {
          to: "/dashboard",
          label: "Executive Dashboard",
          icon: <LayoutDashboard size={18} />,
        },
        {
          to: "/analytics",
          label: "Analytics & Trends",
          icon: <BarChart2 size={18} />,
        },
      ],
    },
    {
      label: "RESEARCH",
      items: [
        {
          to: "/research-profile",
          label: "Research Profile",
          icon: <UserCheck size={18} />,
        },
        {
          to: "/trends",
          label: "Research Intelligence",
          icon: <TrendingUp size={18} />,
        },
      ],
    },
    {
      label: "FUNDING",
      items: [
        {
          to: "/funding",
          label: "Funding Intelligence",
          icon: <Search size={18} />,
        },
      ],
    },
    {
      label: "PATENTS",
      items: [
        {
          to: "/patent-intel",
          label: "Patent Landscape",
          icon: <FileKey size={18} />,
        },
      ],
    },
    {
      label: "TECHNOLOGY",
      items: [
        {
          to: "/tech-intel",
          label: "Technology Intelligence",
          icon: <Cpu size={18} />,
        },
      ],
    },
    {
      label: "INNOVATION",
      items: [
        {
          to: "/innovation-score",
          label: "Innovation Score",
          icon: <Award size={18} />,
        },
        {
          to: "/commercialization",
          label: "Commercialization",
          icon: <DollarSign size={18} />,
        },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        {
          to: "/notifications",
          label: "Proactive Alerts",
          icon: <Bell size={18} />,
        },
        {
          to: "/reports",
          label: "Reports & Dossier",
          icon: <FileText size={18} />,
        },
      ],
    },
  ];

  if (isAdmin) {
    navSections.push({
      label: "ADMINISTRATION",
      items: [
        {
          to: "/admin",
          label: "Platform Governance",
          icon: <ShieldCheck size={18} />,
        },
      ],
    });
  }

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`enterprise-sidebar ${isOpen ? "sidebar-open" : ""}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-hex">
            <Sparkles size={18} className="brand-sparkle" />
          </div>
          <div className="brand-info">
            <span className="brand-title">IntelliResearch</span>
            <span className="brand-badge">Intelligence Platform</span>
          </div>
        </div>

        {/* Categorized Navigation */}
        <div className="sidebar-nav-container">
          {navSections.map((section) => (
            <div key={section.label} className="nav-group-section">
              <div className="nav-group-label">{section.label}</div>
              <nav className="sidebar-nav">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "link-active" : ""}`
                    }
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                  >
                    <span className="link-icon">{item.icon}</span>
                    <span className="link-label">{item.label}</span>
                    <ChevronRight size={13} className="link-chevron" />
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Info Card */}
        <div className="sidebar-footer">
          <div className="internship-badge-card">
            <span className="internship-tag">Live Intelligence</span>
            <p className="internship-desc">
              Multi-source scientific data connected to federal grant and patent APIs.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}