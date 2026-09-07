import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Search,
  TrendingUp,
  FileKey,
  Cpu,
  Award,
  DollarSign,
  Bell,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import "./Sidebar.css";

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      status: "active"
    },
    {
      to: "/research-profile",
      label: "Research Profile",
      icon: <UserCheck size={18} />,
      status: "active",
      badge: "Module 2"
    },
    {
      to: "/funding",
      label: "Funding Opportunities",
      icon: <Search size={18} />,
      status: "soon"
    },
    {
      to: "/trends",
      label: "Research Trends",
      icon: <TrendingUp size={18} />,
      status: "soon"
    },
    {
      to: "/patent-intel",
      label: "Patent Intelligence",
      icon: <FileKey size={18} />,
      status: "soon"
    },
    {
      to: "/tech-intel",
      label: "Technology Intelligence",
      icon: <Cpu size={18} />,
      status: "soon"
    },
    {
      to: "/innovation-score",
      label: "Innovation Score",
      icon: <Award size={18} />,
      status: "soon"
    },
    {
      to: "/commercialization",
      label: "Commercialization",
      icon: <DollarSign size={18} />,
      status: "soon"
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: <Bell size={18} />,
      status: "soon"
    },
    {
      to: "/reports",
      label: "Reports & Export",
      icon: <FileText size={18} />,
      status: "soon"
    }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`enterprise-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-hex">
            <Sparkles size={20} className="brand-sparkle" />
          </div>
          <div className="brand-info">
            <span className="brand-title">IntelliResearch</span>
            <span className="brand-badge">Enterprise v2.0</span>
          </div>
        </div>

        <div className="sidebar-nav-container">
          <div className="nav-group-label">RESEARCH PLATFORM</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
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
                {item.badge && <span className="badge-highlight">{item.badge}</span>}
                {item.status === "soon" && <span className="badge-soon">Preview</span>}
                <ChevronRight size={14} className="link-chevron" />
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="internship-badge-card">
            <span className="internship-tag">Infosys Internship</span>
            <p className="internship-desc">AI Research Funding & Innovation Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
}