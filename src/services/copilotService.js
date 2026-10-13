/**
 * Research Discovery & Innovation Copilot Client Service
 * Connects to FastAPI backend /api/copilot endpoints.
 */

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

function getHeaders(userId) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const activeUserId = userId || localStorage.getItem('ri_copilot_user_id') || 'demo-user-eval-01';
  headers['x-user-id'] = activeUserId;
  return headers;
}

function formatErrorMessage(errPayload, fallback = 'Operation failed') {
  if (!errPayload) return fallback;
  if (typeof errPayload === 'string') return errPayload;
  if (typeof errPayload.detail === 'string') return errPayload.detail;
  if (Array.isArray(errPayload.detail)) {
    return errPayload.detail.map(d => (d.msg ? `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}` : JSON.stringify(d))).join('; ');
  }
  if (errPayload.message) return errPayload.message;
  return fallback;
}

export const copilotService = {
  /**
   * Create a new research discovery session
   */
  async createSession({ topic, title, domain = 'Artificial Intelligence', user_level = 'Beginner', skills = [], resources = '' }, userId) {
    const formattedResources = typeof resources === 'object' && resources !== null
      ? resources
      : (resources ? { description: String(resources) } : {});

    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/sessions`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({
        topic,
        title,
        domain,
        user_level,
        skills,
        resources: formattedResources,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(err, 'Failed to initialize copilot session'));
    }
    return await res.json();
  },

  /**
   * List all copilot sessions for the current user
   */
  async listSessions(userId) {
    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/sessions`, {
      method: 'GET',
      headers: getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve copilot sessions');
    }
    return await res.json();
  },

  /**
   * Get full details of a specific session (messages, ideas, project plan)
   */
  async getSession(sessionId, userId) {
    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/sessions/${sessionId}`, {
      method: 'GET',
      headers: getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error(`Failed to retrieve session ${sessionId}`);
    }
    return await res.json();
  },

  /**
   * Delete a copilot session
   */
  async deleteSession(sessionId, userId) {
    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error(`Failed to delete session ${sessionId}`);
    }
    return await res.json();
  },

  /**
   * Send a chat message or transition stage
   */
  async chat({ session_id, message, stage = null, options = {} }, userId) {
    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({
        session_id,
        message,
        stage,
        options,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(err, 'Copilot intelligence generation failed'));
    }
    return await res.json();
  },

  /**
   * Select a candidate idea to trigger project blueprint formulation (Stage 5)
   */
  async selectIdea(sessionId, ideaId, constraints = '', userId) {
    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/sessions/${sessionId}/select-idea`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({
        idea_id: ideaId,
        constraints,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(err, 'Failed to select idea'));
    }
    return await res.json();
  },

  /**
   * Export session payload for reporting
   */
  async exportSession(sessionId, userId) {
    const res = await fetch(`${BACKEND_BASE_URL}/api/copilot/sessions/${sessionId}/export`, {
      method: 'GET',
      headers: getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error(`Failed to export session ${sessionId}`);
    }
    return await res.json();
  },
};
