import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import "./DashboardLayout.css";

export default function DashboardLayout({ children, pageTitle, breadcrumbs }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="enterprise-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="enterprise-main-wrapper">
        <TopNav
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="enterprise-content-area">{children}</main>
      </div>
    </div>
  );
}