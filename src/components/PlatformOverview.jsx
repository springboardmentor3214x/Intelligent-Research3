import { useEffect, useRef } from 'react';
import { UserPlus, Search, Brain, BarChart3, CheckCircle2 } from 'lucide-react';
import { workflowSteps } from '../data/modules';

const ICON_MAP = { UserPlus, Search, Brain, BarChart3, CheckCircle2 };

export default function PlatformOverview() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    const elements = sectionRef.current?.querySelectorAll('.reveal');
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="platform-overview section" id="overview" ref={sectionRef}>
      <div className="container">
        <div className="section-header reveal">
          <div className="section-badge">Platform Overview</div>
          <h2 className="section-title">
            One Platform for the Complete Innovation Lifecycle
          </h2>
          <p className="section-desc">
            From research discovery and funding intelligence to patents, emerging technologies and
            commercialization, the platform connects fragmented information into a unified
            decision-support workspace.
          </p>
        </div>

        {/* Workflow */}
        <div className="workflow-steps reveal stagger-2">
          {workflowSteps.map((step, i) => {
            const Icon = ICON_MAP[step.icon] || Brain;
            return (
              <div key={step.step} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="workflow-step">
                  <div className="workflow-step-num">{step.step}</div>
                  <div className="workflow-step-icon">
                    <Icon size={26} strokeWidth={1.75} />
                  </div>
                  <div className="workflow-step-title">{step.title}</div>
                  <div className="workflow-step-desc">{step.description}</div>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className="workflow-connector" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
