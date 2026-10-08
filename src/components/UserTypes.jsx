import { useEffect, useRef } from 'react';
import {
  BookOpen, Rocket, Lightbulb, Building2, Briefcase, TrendingUp, Settings,
} from 'lucide-react';
import { userTypes } from '../data/modules';

const ICON_MAP = { BookOpen, Rocket, Lightbulb, Building2, Briefcase, TrendingUp, Settings };

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function UserTypes() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="user-types-section section" id="about" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal">
          <div className="section-badge">Who Uses This Platform</div>
          <h2 className="section-title">Built for Multiple Innovation Stakeholders</h2>
          <p className="section-desc">
            From individual researchers to enterprise innovation teams, each role gets a
            tailored intelligence workspace.
          </p>
        </div>

        <div
          className="user-types-grid reveal stagger-2"
          style={{
            /* 4 cols then last 3 centered */
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {userTypes.map((user) => {
            const Icon = ICON_MAP[user.icon] || BookOpen;
            return (
              <div key={user.role} className="user-type-card">
                <div
                  className="user-type-icon"
                  style={{
                    background: hexToRgba(user.color, 0.1),
                    color: user.color,
                  }}
                >
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <div className="user-type-role">{user.role}</div>
                <div className="user-type-desc">{user.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
