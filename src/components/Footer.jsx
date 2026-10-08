import { useNavigate } from 'react-router-dom';

const FOOTER_COLS = [
  {
    title: 'Platform',
    links: ['Overview', 'Intelligence Modules', 'How It Works', 'Data Sources'],
  },
  {
    title: 'User Roles',
    links: ['Researcher', 'Startup Founder', 'Innovation Manager', 'University', 'Enterprise', 'Investor'],
  },
  {
    title: 'Company',
    links: ['About Platform', 'Privacy Policy', 'Terms of Service', 'Contact Us'],
  },
];

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">RI</div>
              <div className="footer-logo-text">
                Research Funding &amp;<br />Innovation Intelligence
              </div>
            </div>
            <p className="footer-brand-desc">
              An enterprise platform connecting researchers, startups, universities and enterprises
              with research, funding, patent and technology intelligence.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 18px' }}
                onClick={() => navigate('/login')}
              >
                Get Started
              </button>
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <ul className="footer-links">
                {col.links.map((link) => (
                  <li key={link} className="footer-link">{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © {year} Research Funding &amp; Innovation Intelligence Platform. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <span className="footer-link">Privacy</span>
            <span className="footer-link">Terms</span>
            <span className="footer-link">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
