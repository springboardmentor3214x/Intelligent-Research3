import { useState } from 'react';
import { getProfile, updateProfile } from '../services/profileService';
export function useResearchProfile() { const [profile, setProfile] = useState(getProfile); function saveProfile(nextProfile) { setProfile(updateProfile(nextProfile)); } return { profile, saveProfile }; }