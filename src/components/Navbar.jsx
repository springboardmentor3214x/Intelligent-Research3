import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Intelligence Modules', href: '#modules' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Data Sources', href: '#data-sources' },
  { label: 'About Platform', href: '#about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href) => {
    setMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo */}
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">RI</div>
            <div className="logo-text">
              <div className="logo-name">Research Funding &amp; Innovation Intelligence</div>
              <div className="logo-subtitle">Platform</div>
            </div>
          </div>

          {/* Nav Links (desktop) */}
          <ul className="nav-links">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <span
                  className="nav-link"
                  onClick={() => handleNavClick(link.href)}
                >
                  {link.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Auth Buttons */}
          <div className="nav-buttons">
            <button className="btn btn-outline" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              Sign Up
            </button>
            <button
              className="hamburger"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span style={menuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
              <span style={menuOpen ? { opacity: 0 } : {}} />
              <span style={menuOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {NAV_LINKS.map((link) => (
          <span
            key={link.label}
            className="mobile-nav-link"
            onClick={() => handleNavClick(link.href)}
          >
            {link.label}
          </span>
        ))}
        <div className="mobile-nav-buttons">
          <button
            className="btn btn-outline"
            onClick={() => { setMenuOpen(false); navigate('/login'); }}
          >
            Login
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setMenuOpen(false); navigate('/register'); }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
}
