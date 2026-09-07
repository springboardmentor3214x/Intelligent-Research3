import { mockResearchProfile } from '../data/mockResearchProfile';

const STORAGE_KEY = 'researchProfile';
function clone(value) { return JSON.parse(JSON.stringify(value)); }
export function getProfile() { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : clone(mockResearchProfile); }
export function updateProfile(profile) { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); window.dispatchEvent(new Event('research-profile-updated')); return clone(profile); }
export function resetProfile() { localStorage.removeItem(STORAGE_KEY); return getProfile(); }