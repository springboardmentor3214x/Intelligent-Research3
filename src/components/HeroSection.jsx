import { useNavigate } from 'react-router-dom';
import {
  Search, TrendingUp, FileText, Lightbulb, Award,
  FlaskConical, Database, BarChart3, Brain
} from 'lucide-react';
import { stats } from '../data/modules';

const FEATURE_TAGS = [
  'Funding Discovery',
  'Research Intelligence',
  'Patent Analytics',
  'Technology Intelligence',
  'Innovation Scoring',
];

// Orbit icon data
const ORBIT_1_ICONS = [
  { Icon: Search, color: '#1769C2', bg: '#EAF3FF', label: 'Funding', pos: 'orbit-icon-top' },
  { Icon: TrendingUp, color: '#15835B', bg: '#E8F5EE', label: 'Research', pos: 'orbit-icon-right' },
  { Icon: FileText, color: '#D9822B', bg: '#FFF3E8', label: 'Patents', pos: 'orbit-icon-bottom' },
  { Icon: Award, color: '#7354C7', bg: '#F0EDFB', label: 'Scoring', pos: 'orbit-icon-left' },
];

const ORBIT_2_ICONS = [
  { Icon: Lightbulb, color: '#1769C2', bg: '#EAF3FF', label: 'Tech', pos: 'orbit-icon-top' },
  { Icon: BarChart3, color: '#15835B', bg: '#E8F5EE', label: 'Analytics', pos: 'orbit-icon-right' },
  { Icon: Database, color: '#D9822B', bg: '#FFF3E8', label: 'Data', pos: 'orbit-icon-bottom' },
  { Icon: FlaskConical, color: '#7354C7', bg: '#F0EDFB', label: 'Innovation', pos: 'orbit-icon-left' },
];

const FLOAT_CARDS = [
  {
    label: 'Research Trends',
    value: 'Emerging topics detected',
    dotColor: '#1769C2',
    pos: 'fc-top-left',
  },
  {
    label: 'Funding Match',
    value: '12 relevant opportunities',
    dotColor: '#15835B',
    pos: 'fc-top-right',
  },
  {
    label: 'Patent Intelligence',
    value: 'Technology landscape analyzed',
    dotColor: '#D9822B',
    pos: 'fc-bottom-left',
  },
  {
    label: 'Technology Watch',
    value: 'Emerging technology detected',
    dotColor: '#7354C7',
    pos: 'fc-bottom-right',
  },
];

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToOverview = () => {
    const el = document.querySelector('#overview');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero" id="home">
      {/* Background particles */}
      <div className="hero-particle" style={{ width: 8, height: 8, top: '20%', left: '8%', animationDelay: '0s' }} />
      <div className="hero-particle" style={{ width: 5, height: 5, top: '60%', left: '5%', animationDelay: '-2s', background: '#15835B' }} />
      <div className="hero-particle" style={{ width: 6, height: 6, top: '80%', left: '15%', animationDelay: '-4s', background: '#7354C7' }} />

      <div className="container">
        <div className="hero-grid">
          {/* LEFT */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-dot" />
              Enterprise Research Intelligence Platform
            </div>

            <h1 className="hero-title">
              Research, <span className="accent-blue">Funding</span> &amp;{' '}
              <span className="accent-green">Innovation</span>{' '}
              <span className="accent-purple">Intelligence</span> — Connected.
            </h1>

            <p className="hero-description">
              An intelligent platform that helps researchers, startups, universities and enterprises
              discover funding opportunities, analyze research trends, explore patent landscapes,
              monitor emerging technologies and transform innovation data into actionable insights.
            </p>

            <div className="hero-tags">
              {FEATURE_TAGS.map((tag) => (
                <span key={tag} className="hero-tag">{tag}</span>
              ))}
            </div>

            <div className="hero-cta">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/login')}
              >
                Get Started →
              </button>
              <button
                className="btn btn-ghost btn-lg"
                onClick={scrollToOverview}
              >
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              {stats.map((s) => (
                <div key={s.label} className="hero-stat">
                  <span className="hero-stat-value">{s.value}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Hero Visual */}
          <div className="hero-visual-wrapper">
            <div className="hero-visual-container">
              {/* Orbit Ring 1 */}
              <div className="orbit-ring orbit-ring-1">
                {ORBIT_1_ICONS.map(({ Icon, color, bg, pos, label }) => (
                  <div key={label} className={`orbit-icon ${pos}`} title={label}>
                    <Icon size={22} color={color} style={{ background: bg, padding: 2, borderRadius: 6 }} />
                  </div>
                ))}
              </div>

              {/* Orbit Ring 2 */}
              <div className="orbit-ring orbit-ring-2">
                {ORBIT_2_ICONS.map(({ Icon, color, bg, pos, label }) => (
                  <div key={label} className={`orbit-icon ${pos}`} title={label}>
                    <Icon size={20} color={color} />
                  </div>
                ))}
              </div>

              {/* Central Card */}
              <div className="hero-central-card">
                <div className="central-icon-ring">
                  <Brain size={44} color="#1769C2" className="central-ai-icon" strokeWidth={1.5} />
                </div>
                <div className="central-label">
                  Research &amp;<br />Innovation AI
                </div>
              </div>

              {/* Floating info cards */}
              {FLOAT_CARDS.map((card) => (
                <div key={card.label} className={`floating-card ${card.pos}`}>
                  <div className="floating-card-label">
                    <span className="floating-card-dot" style={{ background: card.dotColor }} />
                    {card.label}
                  </div>
                  <div className="floating-card-value">{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
