import { initialResearchProfile } from "../data/mockResearchProfile";
import { apiRequest } from "./api";

const STORAGE_KEY = "intelligent_research_profile_v2";

/**
 * Normalizes and binds research profile to the authenticated user.
 */
export function getStoredProfile(authUser) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed = raw ? JSON.parse(raw) : null;

    // Use current authenticated user if provided or from localStorage
    let currentUser = authUser;
    if (!currentUser) {
      try {
        const savedAuth = localStorage.getItem("auth_user");
        if (savedAuth) currentUser = JSON.parse(savedAuth);
      } catch (e) {}
    }

    const realName = currentUser?.name?.trim() || parsed?.personalInfo?.fullName || "Researcher";
    const realEmail = currentUser?.email?.trim() || parsed?.personalInfo?.email || "";
    const realRole = currentUser?.role || parsed?.personalInfo?.researcherType || "Academic Researcher";
    const realId = currentUser?.id || currentUser?.user_id
      ? `RES-${10000 + (currentUser.id || currentUser.user_id)}`
      : parsed?.id || "RES-10234";

    const base = parsed || initialResearchProfile;

    const merged = {
      ...base,
      id: realId,
      personalInfo: {
        ...base.personalInfo,
        fullName: realName,
        email: realEmail,
        researcherType: realRole,
        designation: currentUser?.designation || base.personalInfo?.designation || "Senior AI Researcher",
        country: currentUser?.country || base.personalInfo?.country || "India",
        state: base.personalInfo?.state || "Karnataka",
        city: base.personalInfo?.city || "Bengaluru",
        phone: currentUser?.phone || base.personalInfo?.phone || "+91 98765 43210",
        photoUrl: currentUser?.picture || base.personalInfo?.photoUrl || "",
        qualification: base.personalInfo?.qualification || "Ph.D. in Computer Science & Artificial Intelligence",
        experienceYears: Number(base.personalInfo?.experienceYears) || 9
      },
      organization: {
        ...base.organization,
        name: currentUser?.organization || base.organization?.name || "National Institute of Advanced Computing",
        department: currentUser?.department || base.organization?.department || "Artificial Intelligence & Computational Intelligence",
        laboratory: base.organization?.laboratory || "AI & Cognitive Computing Laboratory",
        type: base.organization?.type || "Research Institute",
        country: currentUser?.country || base.organization?.country || "India",
        city: base.organization?.city || "Bengaluru"
      },
      research: {
        ...base.research,
        primaryDomain: currentUser?.research_domain || base.research?.primaryDomain || "Artificial Intelligence",
        researchAreas: Array.isArray(currentUser?.research_areas) && currentUser.research_areas.length > 0
          ? currentUser.research_areas
          : base.research?.researchAreas || ["Machine Learning", "Deep Learning", "Explainable AI", "Predictive Analytics"],
        interests: base.research?.interests || "Explainable AI, intelligent systems, deep neural architectures, clinical decision support",
        summary: base.research?.summary || "Dedicated to advancing trustworthy artificial intelligence, transparent deep learning algorithms, and real-world intelligence pipelines."
      },
      keywords: Array.isArray(currentUser?.research_keywords) && currentUser.research_keywords.length > 0
        ? currentUser.research_keywords
        : Array.isArray(base.keywords) ? base.keywords : initialResearchProfile.keywords,
      technologies: Array.isArray(base.technologies) ? base.technologies : initialResearchProfile.technologies,
      publications: Array.isArray(base.publications) ? base.publications : initialResearchProfile.publications,
      patents: Array.isArray(base.patents) ? base.patents : initialResearchProfile.patents,
      researchHistory: Array.isArray(base.researchHistory) ? base.researchHistory : initialResearchProfile.researchHistory
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error("Error loading profile:", err);
    return initialResearchProfile;
  }
}

/**
 * Persists profile to localStorage and synchronizes with backend if logged in
 */
export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.error("Error saving profile to storage:", err);
    throw new Error("Failed to persist profile changes");
  }
}

export const profileService = {
  async getProfile(authUser) {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const backendUser = await apiRequest("/users/me");
        if (backendUser) {
          return getStoredProfile(backendUser);
        }
      } catch (err) {
        // Fallback to local profile
      }
    }
    return getStoredProfile(authUser);
  },

  async updateProfile(updates) {
    const current = getStoredProfile();
    const merged = {
      ...current,
      ...updates,
      personalInfo: {
        ...current.personalInfo,
        ...(updates.personalInfo || {})
      },
      organization: {
        ...current.organization,
        ...(updates.organization || {})
      },
      research: {
        ...current.research,
        ...(updates.research || {})
      }
    };
    saveProfile(merged);

    // Sync to backend if token exists
    const token = localStorage.getItem("auth_token");
    if (token && (updates.personalInfo || updates.organization || updates.research)) {
      try {
        const personal = merged.personalInfo || {};
        const org = merged.organization || {};
        const res = merged.research || {};

        await apiRequest("/users/me", {
          method: "PUT",
          body: JSON.stringify({
            name: personal.fullName,
            organization: org.name,
            department: org.department,
            designation: personal.designation,
            country: personal.country,
            research_domain: res.primaryDomain,
            research_areas: res.researchAreas || [],
            research_keywords: merged.keywords || [],
            phone: personal.phone
          })
        });
      } catch (e) {
        // Continue with local storage save
      }
    }

    return merged;
  },

  // ── Keywords ──
  async setKeywords(keywords) {
    const current = getStoredProfile();
    const updated = { ...current, keywords: keywords.slice(0, 20) };
    saveProfile(updated);

    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        await apiRequest("/users/me", {
          method: "PUT",
          body: JSON.stringify({
            research_keywords: updated.keywords
          })
        });
      } catch (e) {}
    }

    return updated.keywords;
  },

  // ── Technologies ──
  async getTechnologies() {
    return (getStoredProfile().technologies || []);
  },

  async addTechnology(technology) {
    const current = getStoredProfile();
    const newTech = {
      ...technology,
      id: `tech-${Date.now()}`
    };
    const updated = {
      ...current,
      technologies: [newTech, ...(current.technologies || [])]
    };
    saveProfile(updated);
    return newTech;
  },

  async updateTechnology(id, technology) {
    const current = getStoredProfile();
    const updatedList = (current.technologies || []).map((t) =>
      t.id === id ? { ...t, ...technology, id } : t
    );
    const updated = { ...current, technologies: updatedList };
    saveProfile(updated);
    return updatedList.find((t) => t.id === id);
  },

  async deleteTechnology(id) {
    const current = getStoredProfile();
    const updatedList = (current.technologies || []).filter((t) => t.id !== id);
    const updated = { ...current, technologies: updatedList };
    saveProfile(updated);
    return true;
  },

  // ── Publications ──
  async getPublications() {
    return (getStoredProfile().publications || []);
  },

  async addPublication(pubData) {
    const current = getStoredProfile();
    const newPub = {
      ...pubData,
      id: `pub-${Date.now()}`,
      citationCount: Number(pubData.citationCount) || 0,
      authors: Array.isArray(pubData.authors)
        ? pubData.authors
        : typeof pubData.authors === "string"
        ? pubData.authors.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    };
    const updated = {
      ...current,
      publications: [newPub, ...(current.publications || [])]
    };
    saveProfile(updated);
    return newPub;
  },

  async updatePublication(id, pubData) {
    const current = getStoredProfile();
    const updatedList = (current.publications || []).map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...pubData,
          id,
          citationCount: Number(pubData.citationCount) || 0,
          authors: Array.isArray(pubData.authors)
            ? pubData.authors
            : typeof pubData.authors === "string"
            ? pubData.authors.split(",").map((s) => s.trim()).filter(Boolean)
            : p.authors
        };
      }
      return p;
    });
    const updated = { ...current, publications: updatedList };
    saveProfile(updated);
    return updatedList.find((p) => p.id === id);
  },

  async deletePublication(id) {
    const current = getStoredProfile();
    const updatedList = (current.publications || []).filter((p) => p.id !== id);
    const updated = { ...current, publications: updatedList };
    saveProfile(updated);
    return true;
  },

  // ── Patents ──
  async getPatents() {
    return (getStoredProfile().patents || []);
  },

  async addPatent(patData) {
    const current = getStoredProfile();
    const newPat = {
      ...patData,
      id: `pat-${Date.now()}`,
      citationCount: Number(patData.citationCount) || 0,
      inventors: Array.isArray(patData.inventors)
        ? patData.inventors
        : typeof patData.inventors === "string"
        ? patData.inventors.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    };
    const updated = {
      ...current,
      patents: [newPat, ...(current.patents || [])]
    };
    saveProfile(updated);
    return newPat;
  },

  async updatePatent(id, patData) {
    const current = getStoredProfile();
    const updatedList = (current.patents || []).map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...patData,
          id,
          citationCount: Number(patData.citationCount) || 0,
          inventors: Array.isArray(patData.inventors)
            ? patData.inventors
            : typeof patData.inventors === "string"
            ? patData.inventors.split(",").map((s) => s.trim()).filter(Boolean)
            : p.inventors
        };
      }
      return p;
    });
    const updated = { ...current, patents: updatedList };
    saveProfile(updated);
    return updatedList.find((p) => p.id === id);
  },

  async deletePatent(id) {
    const current = getStoredProfile();
    const updatedList = (current.patents || []).filter((p) => p.id !== id);
    const updated = { ...current, patents: updatedList };
    saveProfile(updated);
    return true;
  },

  // ── Research History ──
  async addResearchHistory(histData) {
    const current = getStoredProfile();
    const newHist = {
      ...histData,
      id: `hist-${Date.now()}`
    };
    const updated = {
      ...current,
      researchHistory: [newHist, ...(current.researchHistory || [])]
    };
    saveProfile(updated);
    return newHist;
  },

  async updateResearchHistory(id, histData) {
    const current = getStoredProfile();
    const updatedList = (current.researchHistory || []).map((h) =>
      h.id === id ? { ...h, ...histData, id } : h
    );
    const updated = { ...current, researchHistory: updatedList };
    saveProfile(updated);
    return updatedList.find((h) => h.id === id);
  },

  async deleteResearchHistory(id) {
    const current = getStoredProfile();
    const updatedList = (current.researchHistory || []).filter((h) => h.id !== id);
    const updated = { ...current, researchHistory: updatedList };
    saveProfile(updated);
    return true;
  }
};