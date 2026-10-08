/**
 * MODULE 10: RELEVANCE ENGINE
 * Explainable, deterministic relevance scoring algorithm.
 * Evaluates semantic and keyword overlap between User Profiles and Platform Events.
 * Never invents arbitrary relevance.
 */

function normalize(text) {
  if (!text) return '';
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

/**
 * Evaluates event relevance against user research profile
 * @param {Object} profile - User research profile
 * @param {Object} eventPayload - Event payload data
 * @param {string} sourceModule - Module emitting the event
 * @returns {{ score: number, isRelevant: boolean, reasons: string[], matchedTerms: string[] }}
 */
export function evaluateRelevance(profile = {}, eventPayload = {}, sourceModule = 'platform') {
  let score = 0;
  const reasons = [];
  const matchedTerms = [];

  const userDomain = normalize(profile.researchDomain || profile.research_domain || '');
  const userAreas = (profile.researchAreas || profile.research_areas || []).map(normalize).filter(Boolean);
  const userInterests = (profile.researchInterests || profile.research_interests || []).map(normalize).filter(Boolean);
  const userKeywords = (profile.researchKeywords || profile.research_keywords || []).map(normalize).filter(Boolean);
  const userTechs = (profile.technologyAreas || profile.technology_areas || []).map(normalize).filter(Boolean);
  const userRole = (profile.role || 'researcher').toLowerCase();

  // Combine event searchable corpus
  const eventTitle = normalize(eventPayload.title || eventPayload.opportunity_name || eventPayload.technology || '');
  const eventDesc = normalize(eventPayload.description || eventPayload.desc || eventPayload.abstract || '');
  const eventDomain = normalize(eventPayload.domain || eventPayload.research_domain || '');
  const eventTech = normalize(eventPayload.technology || eventPayload.technology_domain || '');
  const eventAreas = (eventPayload.research_areas || []).map(normalize);
  const eventKeywords = (eventPayload.keywords || []).map(normalize);
  const targetRole = (eventPayload.target_role || '').toLowerCase();

  const corpus = `${eventTitle} ${eventDesc} ${eventDomain} ${eventTech} ${eventAreas.join(' ')} ${eventKeywords.join(' ')}`;

  // 1. Direct Domain Match (+30)
  if (userDomain && (corpus.includes(userDomain) || (eventDomain && (userDomain.includes(eventDomain) || eventDomain.includes(userDomain))))) {
    score += 30;
    const domainText = profile.researchDomain || profile.research_domain;
    reasons.push(`Direct alignment with your research domain: ${domainText}`);
    matchedTerms.push(domainText);
  }

  // 2. Research Areas Match (up to +25)
  const matchedAreaList = [];
  userAreas.forEach((area) => {
    if (area && corpus.includes(area)) {
      matchedAreaList.push(area);
      matchedTerms.push(area);
    }
  });
  if (matchedAreaList.length > 0) {
    const areaScore = Math.min(25, matchedAreaList.length * 15);
    score += areaScore;
    reasons.push(`Matched research area(s): ${matchedAreaList.slice(0, 3).join(', ')}`);
  }

  // 3. Monitored Technology Match (up to +25)
  const matchedTechList = [];
  userTechs.forEach((tech) => {
    if (tech && (corpus.includes(tech) || (eventTech && eventTech.includes(tech)))) {
      matchedTechList.push(tech);
      matchedTerms.push(tech);
    }
  });
  if (matchedTechList.length > 0) {
    const techScore = Math.min(25, matchedTechList.length * 15);
    score += techScore;
    reasons.push(`Matched monitored technology: ${matchedTechList.slice(0, 3).join(', ')}`);
  }

  // 4. Research Keywords & Interests (up to +20)
  const allTerms = [...userKeywords, ...userInterests];
  const matchedKeywords = [];
  allTerms.forEach((term) => {
    if (term && term.length > 2 && corpus.includes(term)) {
      if (!matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
        matchedTerms.push(term);
      }
    }
  });
  if (matchedKeywords.length > 0) {
    const kwScore = Math.min(20, matchedKeywords.length * 6);
    score += kwScore;
    reasons.push(`Matched research keywords: ${matchedKeywords.slice(0, 4).join(', ')}`);
  }

  // 5. Role Alignment (+10)
  if (targetRole) {
    if (userRole.includes(targetRole) || targetRole.includes(userRole)) {
      score += 10;
      reasons.push(`Targeted for your role: ${profile.role || 'Researcher'}`);
    }
  } else {
    // Standard baseline role relevance
    if (userRole.includes('researcher') && ['research', 'funding', 'patents'].includes(sourceModule)) {
      score += 5;
    } else if ((userRole.includes('founder') || userRole.includes('startup')) && ['funding', 'commercialization', 'technology'].includes(sourceModule)) {
      score += 5;
    } else if (userRole.includes('manager') && ['technology', 'innovation', 'commercialization'].includes(sourceModule)) {
      score += 5;
    } else if (userRole.includes('admin')) {
      score += 10;
    }
  }

  // Normalize final score to 0 - 100
  let finalScore = Math.min(100, Math.round(score));

  // Platform and Report events have intrinsic relevance for the requesting user
  if (['reports', 'platform', 'system'].includes(sourceModule)) {
    finalScore = Math.max(finalScore, 90);
    if (reasons.length === 0) {
      reasons.push('Platform service delivery for your active session');
    }
  }

  // Relevance decision threshold: >= 35 or system/report modules
  const isRelevant = finalScore >= 35 || ['reports', 'platform', 'system'].includes(sourceModule);

  return {
    score: finalScore,
    isRelevant,
    reasons,
    matchedTerms: Array.from(new Set(matchedTerms))
  };
}
