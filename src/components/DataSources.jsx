import { useEffect, useRef } from 'react';
import { dataSources } from '../data/modules';

const CAT_CLASS = {
  Research: 'source-cat-research',
  Patents: 'source-cat-patents',
  Funding: 'source-cat-funding',
  Intelligence: 'source-cat-intelligence',
};

export default function DataSources() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.15 }
    );
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="data-sources-section section" id="data-sources" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal">
          <div className="section-badge">Data Intelligence</div>
          <h2 className="section-title">Connected Intelligence Sources</h2>
          <p className="section-desc">
            The platform combines research, patent, funding, technology and external intelligence
            sources to create a unified knowledge layer.
          </p>
        </div>

        <div className="sources-grid reveal stagger-2">
          {dataSources.map((src) => (
            <div key={src.name} className="source-card">
              <span className={`source-category ${CAT_CLASS[src.category] || 'source-cat-research'}`}>
                {src.category}
              </span>
              <div className="source-name">{src.name}</div>
              <div className="source-desc">{src.description}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '12.5px',
            color: 'var(--text-muted)',
            marginTop: 24,
            fontStyle: 'italic',
          }}
        >
          Data source availability depends on integration configuration and implementation phase.
        </p>
      </div>
    </section>
  );
}
