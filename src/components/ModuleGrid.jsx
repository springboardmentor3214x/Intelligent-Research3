import { useEffect, useRef } from 'react';
import ModuleCard from './ModuleCard';
import { modules } from '../data/modules';

export default function ModuleGrid() {
  const gridRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.module-card').forEach((card, i) => {
              setTimeout(() => {
                card.style.animationPlayState = 'running';
              }, i * 80);
            });
          }
        });
      },
      { threshold: 0.05 }
    );

    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="modules-section section" id="modules">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">Complete Architecture</div>
          <h2 className="section-title">12 Intelligence Modules</h2>
          <p className="section-desc">
            A connected architecture covering the complete research, funding and innovation lifecycle.
          </p>
        </div>

        <div className="modules-grid" ref={gridRef}>
          {modules.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
