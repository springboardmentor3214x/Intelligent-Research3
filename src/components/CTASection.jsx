import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="cta-section section">
      <div className="container">
        <div className="cta-inner">
          <h2 className="cta-title">
            Turn Research Data into Innovation Intelligence
          </h2>
          <p className="cta-desc">
            Build a stronger research, funding and innovation strategy with connected intelligence.
          </p>
          <div className="cta-buttons">
            <button className="btn-cta-primary" onClick={() => navigate('/login')}>
              Get Started <ArrowRight size={18} />
            </button>
            <button
              className="btn-cta-ghost"
              onClick={() => {
                const el = document.querySelector('#modules');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Platform <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
