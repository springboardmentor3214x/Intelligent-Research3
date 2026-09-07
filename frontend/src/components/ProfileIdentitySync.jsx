import { useEffect } from 'react';
import { mockResearchProfile } from '../data/mockResearchProfile';

const PROFILE_KEY = 'researchProfile';

function getProfileName() {
  try {
    return (JSON.parse(localStorage.getItem(PROFILE_KEY)) || mockResearchProfile).personalInfo.fullName;
  } catch {
    return mockResearchProfile.personalInfo.fullName;
  }
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function ProfileIdentitySync() {
  useEffect(() => {
    const updateIdentity = () => {
      const name = getProfileName();
      const shortName = name.replace(/^Dr\.\s*/i, '');
      document.querySelectorAll('.rp-user strong, .dashboard-header-actions strong').forEach((element) => { element.textContent = name; });
      document.querySelectorAll('.rp-top-avatar, .dashboard-avatar').forEach((element) => { element.textContent = initials(shortName); });
      document.querySelectorAll('.rp-sidebar-foot strong').forEach((element) => { element.textContent = shortName; });
    };
    updateIdentity();
    window.addEventListener('research-profile-updated', updateIdentity);
    return () => window.removeEventListener('research-profile-updated', updateIdentity);
  });
  return null;
}
