import { useEffect, useRef } from 'react';
import { UserPlus, Search, Brain, BarChart3, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Create Profile',
    icon: UserPlus,
    description:
      'User creates account and defines role, organization and research interests.',
  },
  {
    step: '02',
    title: 'Discover Data',
    icon: Search,
    description:
      'The platform collects relevant research, funding, patent and technology information.',
  },
  {
    step: '03',
    title: 'AI Analysis',
    icon: Brain,
    description:
      'AI/NLP and analytics services process the collected information.',
  },
  {
    step: '04',
    title: 'Generate Intelligence',
    icon: BarChart3,
    description:
      'The system identifies trends, opportunities, risks and recommendations.',
  },
  {
    step: '05',
    title: 'Make Informed Decisions',
    icon: CheckCircle2,
    description:
      'Users access dashboards, alerts, reports and recommendations.',
  },
];

export default function Workflow() {
  const stepsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.2 }
    );
    stepsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="how-it-works section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">Step by Step</div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-desc">
            Five clear steps from account creation to intelligence-driven decisions.
          </p>
        </div>

        <div className="hiw-steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="hiw-step"
                ref={(el) => (stepsRef.current[i] = el)}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="hiw-step-num-wrap">
                  <div className="hiw-step-num">
                    <Icon size={24} strokeWidth={2} />
                  </div>
                </div>
                <div className="hiw-step-content">
                  <div className="hiw-step-title">{step.step}. {step.title}</div>
                  <div className="hiw-step-desc">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
