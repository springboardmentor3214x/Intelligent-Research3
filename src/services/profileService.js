import { supabase } from './supabaseClient';

/* =====================================================================
   profileService.js — Module 2 Profile Service
   All Supabase calls are filtered by auth.uid() (user_id).
   Never reads/writes another user's data.
   ===================================================================== */

// ─── Fetch the current user's profile ────────────────────────────────
export const fetchProfile = async (userId) => {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('research_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('fetchProfile error:', e.message);
    return null;
  }
};

// ─── Check if profile is completed ──────────────────────────────────
export const checkProfileCompletion = async (userId) => {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('research_profiles')
      .select('profile_completed')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return false;
    return data.profile_completed === true;
  } catch (e) {
    return false;
  }
};

// ─── Save / Update profile ───────────────────────────────────────────
export const saveProfile = async (userId, profileData) => {
  if (!userId) throw new Error('User ID required');
  const payload = {
    user_id: userId,
    full_name: profileData.fullName || '',
    country: profileData.country || '',
    organization: profileData.organization || '',
    department: profileData.department || '',
    designation: profileData.designation || '',
    research_domain: profileData.researchDomain || '',
    research_areas: profileData.researchAreas || [],
    research_interests: profileData.researchInterests || [],
    research_keywords: profileData.researchKeywords || [],
    technology_areas: profileData.technologyAreas || [],
    profile_completed: profileData.profile_completed ?? false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('research_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Mark profile as completed ───────────────────────────────────────
export const markProfileComplete = async (userId) => {
  if (!userId) return;
  const { error } = await supabase
    .from('research_profiles')
    .update({ profile_completed: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) console.warn('markProfileComplete error:', error.message);
};

// ─── Publications CRUD ───────────────────────────────────────────────
export const fetchPublications = async (userId) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_publications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      localStorage.setItem(`ri_pubs_${userId}`, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('fetchPublications Supabase fallback:', e.message);
  }
  // Local fallback
  try {
    const local = localStorage.getItem(`ri_pubs_${userId}`);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
};

export const addPublication = async (userId, pub) => {
  if (!userId) throw new Error('User ID required');
  const newPub = {
    id: pub.id || 'pub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    user_id: userId,
    title: pub.title,
    authors: pub.authors || [],
    pub_date: pub.pub_date || null,
    journal: pub.journal || '',
    conference: pub.conference || '',
    pub_type: pub.pub_type || 'Journal Article',
    research_domain: pub.research_domain || '',
    keywords: pub.keywords || [],
    doi: pub.doi || '',
    url: pub.url || '',
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('user_publications')
      .insert(newPub)
      .select()
      .single();
    if (!error && data) {
      const current = await fetchPublications(userId);
      return data;
    }
  } catch (e) {
    console.warn('addPublication Supabase note:', e.message);
  }

  // Fallback to local storage
  const localList = JSON.parse(localStorage.getItem(`ri_pubs_${userId}`) || '[]');
  localList.unshift(newPub);
  localStorage.setItem(`ri_pubs_${userId}`, JSON.stringify(localList));
  return newPub;
};

export const updatePublication = async (userId, pubId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_publications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', pubId)
      .eq('user_id', userId)
      .select()
      .single();
    if (!error && data) return data;
  } catch (e) {
    console.warn('updatePublication Supabase note:', e.message);
  }

  // Local fallback update
  const localList = JSON.parse(localStorage.getItem(`ri_pubs_${userId}`) || '[]');
  const updatedList = localList.map(p => (p.id === pubId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
  localStorage.setItem(`ri_pubs_${userId}`, JSON.stringify(updatedList));
  return updatedList.find(p => p.id === pubId);
};

export const deletePublication = async (userId, pubId) => {
  try {
    await supabase
      .from('user_publications')
      .delete()
      .eq('id', pubId)
      .eq('user_id', userId);
  } catch (e) {
    console.warn('deletePublication Supabase note:', e.message);
  }

  const localList = JSON.parse(localStorage.getItem(`ri_pubs_${userId}`) || '[]');
  const filtered = localList.filter(p => p.id !== pubId);
  localStorage.setItem(`ri_pubs_${userId}`, JSON.stringify(filtered));
};

// ─── Patents CRUD ─────────────────────────────────────────────────────
export const fetchUserPatents = async (userId) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_patents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      localStorage.setItem(`ri_pats_${userId}`, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('fetchUserPatents Supabase fallback:', e.message);
  }
  // Local fallback
  try {
    const local = localStorage.getItem(`ri_pats_${userId}`);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
};

export const addUserPatent = async (userId, pat) => {
  if (!userId) throw new Error('User ID required');
  const newPat = {
    id: pat.id || 'pat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    user_id: userId,
    title: pat.title,
    patent_number: pat.patent_number || '',
    inventor: pat.inventor || '',
    filing_date: pat.filing_date || null,
    publication_date: pat.publication_date || null,
    status: pat.status || 'Filed',
    domain: pat.domain || '',
    patent_url: pat.patent_url || '',
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('user_patents')
      .insert(newPat)
      .select()
      .single();
    if (!error && data) return data;
  } catch (e) {
    console.warn('addUserPatent Supabase note:', e.message);
  }

  const localList = JSON.parse(localStorage.getItem(`ri_pats_${userId}`) || '[]');
  localList.unshift(newPat);
  localStorage.setItem(`ri_pats_${userId}`, JSON.stringify(localList));
  return newPat;
};

export const updateUserPatent = async (userId, patId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_patents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', patId)
      .eq('user_id', userId)
      .select()
      .single();
    if (!error && data) return data;
  } catch (e) {
    console.warn('updateUserPatent Supabase note:', e.message);
  }

  const localList = JSON.parse(localStorage.getItem(`ri_pats_${userId}`) || '[]');
  const updatedList = localList.map(p => (p.id === patId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
  localStorage.setItem(`ri_pats_${userId}`, JSON.stringify(updatedList));
  return updatedList.find(p => p.id === patId);
};

export const deleteUserPatent = async (userId, patId) => {
  try {
    await supabase
      .from('user_patents')
      .delete()
      .eq('id', patId)
      .eq('user_id', userId);
  } catch (e) {
    console.warn('deleteUserPatent Supabase note:', e.message);
  }

  const localList = JSON.parse(localStorage.getItem(`ri_pats_${userId}`) || '[]');
  const filtered = localList.filter(p => p.id !== patId);
  localStorage.setItem(`ri_pats_${userId}`, JSON.stringify(filtered));
};
