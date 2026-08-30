/**
 * Dynamic calculation of profile completion percentage and action recommendations.
 */
export function calculateProfileCompletion(profile) {
  if (!profile) return { percentage: 0, checklist: [], recommendations: [] };

  const personal = profile.personalInfo || {};
  const org = profile.organization || {};
  const research = profile.research || {};
  const keywords = profile.keywords || [];
  const technologies = profile.technologies || [];
  const publications = profile.publications || [];
  const patents = profile.patents || [];
  const history = profile.researchHistory || [];

  const items = [
    {
      id: "basic_info",
      label: "Basic Information",
      tab: "basic",
      weight: 15,
      completed: Boolean(
        personal.fullName &&
        personal.email &&
        personal.designation &&
        personal.country
      ),
      recommendation: "+ Complete your personal and professional background"
    },
    {
      id: "organization",
      label: "Organization Details",
      tab: "organization",
      weight: 15,
      completed: Boolean(
        org.name &&
        org.department &&
        org.laboratory
      ),
      recommendation: "+ Add your organization, department, and laboratory details"
    },
    {
      id: "research_domain",
      label: "Research Domain & Areas",
      tab: "research",
      weight: 15,
      completed: Boolean(
        research.primaryDomain &&
        (research.researchAreas || []).length >= 2
      ),
      recommendation: "+ Specify your primary research domain and specialized areas"
    },
    {
      id: "research_summary",
      label: "Research Interests & Summary",
      tab: "research",
      weight: 10,
      completed: Boolean(
        research.interests &&
        research.interests.length >= 10 &&
        research.summary &&
        research.summary.length >= 20
      ),
      recommendation: "+ Add detailed research interests and career summary"
    },
    {
      id: "keywords",
      label: "Research Keywords (min. 5)",
      tab: "keywords",
      weight: 10,
      completed: keywords.length >= 5,
      recommendation: `+ Add research keywords (${keywords.length}/5 minimum)`
    },
    {
      id: "technologies",
      label: "Technology Expertise (min. 3)",
      tab: "technologies",
      weight: 15,
      completed: technologies.length >= 3,
      recommendation: `+ Add technology stacks and proficiencies (${technologies.length}/3 minimum)`
    },
    {
      id: "publications",
      label: "Publications Record",
      tab: "publications",
      weight: 10,
      completed: publications.length >= 1,
      recommendation: "+ Add your published academic journals and conference papers"
    },
    {
      id: "patents",
      label: "Patent & IP Record",
      tab: "patents",
      weight: 5,
      completed: patents.length >= 1,
      recommendation: "+ Add your registered and pending intellectual property / patents"
    },
    {
      id: "history",
      label: "Research Experience History",
      tab: "history",
      weight: 5,
      completed: history.length >= 1,
      recommendation: "+ Add prior research positions and research experience history"
    }
  ];

  const earned = items.reduce((sum, item) => (item.completed ? sum + item.weight : sum), 0);
  const percentage = Math.min(100, Math.round(earned));

  const checklist = items.map((i) => ({
    id: i.id,
    label: i.label,
    tab: i.tab,
    completed: i.completed,
    weight: i.weight
  }));

  const recommendations = items
    .filter((i) => !i.completed)
    .map((i) => ({
      id: i.id,
      tab: i.tab,
      text: i.recommendation
    }));

  return {
    percentage,
    checklist,
    recommendations
  };
}

/**
 * Calculates dynamic research expertise metrics from technologies and research areas
 */
export function calculateExpertiseMetrics(profile) {
  if (!profile) return [];

  const techList = profile.technologies || [];
  const researchAreas = (profile.research && profile.research.researchAreas) || [];

  const proficiencyMap = {
    Expert: 95,
    Advanced: 85,
    Intermediate: 70,
    Beginner: 50
  };

  const expertise = [];

  // Map technologies
  techList.forEach((tech) => {
    const base = proficiencyMap[tech.proficiency] || 60;
    const expBoost = Math.min(10, (tech.experienceYears || 1) * 1.5);
    expertise.push({
      name: tech.name,
      category: tech.category || "Technology",
      percentage: Math.min(98, Math.round(base + expBoost * 0.5)),
      proficiency: tech.proficiency || "Intermediate",
      years: tech.experienceYears || 1
    });
  });

  // Map research areas if fewer than 4 technologies
  if (expertise.length < 4) {
    researchAreas.forEach((area, idx) => {
      if (!expertise.some((e) => e.name.toLowerCase() === area.toLowerCase())) {
        expertise.push({
          name: area,
          category: "Research Area",
          percentage: Math.max(65, 90 - idx * 6),
          proficiency: "Advanced",
          years: 5
        });
      }
    });
  }

  // Sort descending by percentage
  return expertise.sort((a, b) => b.percentage - a.percentage).slice(0, 6);
}