import { useCallback, useEffect, useMemo, useState } from "react";
import { profileService } from "../services/profileService";
import { useAuth } from "../context/AuthContext";
import {
  calculateExpertiseMetrics,
  calculateProfileCompletion
} from "../utils/profileCompletion";

export function useResearchProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(user);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load research profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completion = useMemo(() => {
    return calculateProfileCompletion(profile);
  }, [profile]);

  const expertise = useMemo(() => {
    return calculateExpertiseMetrics(profile);
  }, [profile]);

  // ── Handlers ──
  const updateSection = useCallback(async (sectionKey, sectionData) => {
    const updated = await profileService.updateProfile({
      [sectionKey]: sectionData
    });
    setProfile(updated);
    return updated;
  }, []);

  const updateKeywords = useCallback(async (keywords) => {
    await profileService.setKeywords(keywords);
    setProfile((prev) => (prev ? { ...prev, keywords } : prev));
  }, []);

  const addTechnology = useCallback(async (tech) => {
    await profileService.addTechnology(tech);
    await loadData();
  }, [loadData]);

  const updateTechnology = useCallback(async (id, tech) => {
    await profileService.updateTechnology(id, tech);
    await loadData();
  }, [loadData]);

  const deleteTechnology = useCallback(async (id) => {
    await profileService.deleteTechnology(id);
    await loadData();
  }, [loadData]);

  const addPublication = useCallback(async (pub) => {
    await profileService.addPublication(pub);
    await loadData();
  }, [loadData]);

  const updatePublication = useCallback(async (id, pub) => {
    await profileService.updatePublication(id, pub);
    await loadData();
  }, [loadData]);

  const deletePublication = useCallback(async (id) => {
    await profileService.deletePublication(id);
    await loadData();
  }, [loadData]);

  const addPatent = useCallback(async (pat) => {
    await profileService.addPatent(pat);
    await loadData();
  }, [loadData]);

  const updatePatent = useCallback(async (id, pat) => {
    await profileService.updatePatent(id, pat);
    await loadData();
  }, [loadData]);

  const deletePatent = useCallback(async (id) => {
    await profileService.deletePatent(id);
    await loadData();
  }, [loadData]);

  const addHistory = useCallback(async (hist) => {
    await profileService.addResearchHistory(hist);
    await loadData();
  }, [loadData]);

  const updateHistory = useCallback(async (id, hist) => {
    await profileService.updateResearchHistory(id, hist);
    await loadData();
  }, [loadData]);

  const deleteHistory = useCallback(async (id) => {
    await profileService.deleteResearchHistory(id);
    await loadData();
  }, [loadData]);

  return {
    profile,
    loading,
    completion,
    expertise,
    updateSection,
    updateKeywords,
    addTechnology,
    updateTechnology,
    deleteTechnology,
    addPublication,
    updatePublication,
    deletePublication,
    addPatent,
    updatePatent,
    deletePatent,
    addHistory,
    updateHistory,
    deleteHistory,
    reload: loadData
  };
}