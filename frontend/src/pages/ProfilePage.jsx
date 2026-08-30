/**
 * pages/ProfilePage.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * Displays and allows editing of the current user's profile.
 *
 * Behaviour:
 *   - Loads user data from AuthContext (already fetched on mount)
 *   - Edit mode toggle — shows inline form
 *   - PUT /users/me on save → calls refreshUser() to sync context
 *   - Loading states, error and success alerts
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/api';
import './ProfilePage.css';

function FieldDisplay({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, role, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'error'|'success', msg: string }

  /* Form state — pre-fill from context */
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
  });
  const [errors, setErrors] = useState({});

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  /* ── Validation ── */
  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required.';
    if (formData.name.trim().length > 100) errs.name = 'Name must be under 100 characters.';
    return errs;
  }

  /* ── Handle input change ── */
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  /* ── Cancel edit ── */
  function handleCancel() {
    setFormData({ name: user?.name ?? '' });
    setErrors({});
    setAlert(null);
    setEditing(false);
  }

  /* ── Save (PUT /users/me) ── */
  async function handleSave(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setAlert(null);
    try {
      await updateMe({ name: formData.name.trim() });
      await refreshUser();
      setAlert({ type: 'success', msg: 'Profile updated successfully!' });
      setEditing(false);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to update profile. Please try again.';
      setAlert({ type: 'error', msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page container animate-fade">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your account information.</p>
      </div>

      {/* ── Alert ── */}
      {alert && (
        <div className={`alert alert-${alert.type}`} role="alert" aria-live="polite">
          <span>{alert.type === 'error' ? '⚠' : '✓'}</span>
          <span>{alert.msg}</span>
        </div>
      )}

      <div className="profile-layout">
        {/* ── Left: avatar + basic info ── */}
        <div className="profile-sidebar card card-sm">
          <div className="avatar avatar-lg profile-avatar">{initials}</div>
          <h2 className="profile-display-name">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </h2>
          <p className="profile-email">{user?.email}</p>
          <span
            className={`badge ${
              role === 'admin'
                ? 'badge-admin'
                : role === 'researcher'
                ? 'badge-researcher'
                : 'badge-user'
            } profile-role-badge`}
          >
            {role ?? 'user'}
          </span>

          <div className="divider" />

          {!editing && (
            <button
              id="btn-edit-profile"
              className="btn btn-secondary btn-full"
              onClick={() => { setEditing(true); setAlert(null); }}
            >
              ✎ Edit Profile
            </button>
          )}
        </div>

        {/* ── Right: detail card ── */}
        <div className="profile-main">
          {!editing ? (
            /* ── View mode ── */
            <div className="card animate-fade">
              <div className="profile-section-heading">Account Details</div>
              <div className="profile-fields">
                <FieldDisplay label="Full Name" value={user?.name} />
                <FieldDisplay label="Email" value={user?.email} />
                <FieldDisplay label="Role" value={role} />
                <FieldDisplay label="User ID" value={user?.id} />
              </div>
            </div>
          ) : (
            /* ── Edit mode ── */
            <form className="card animate-scale" onSubmit={handleSave} noValidate>
              <div className="profile-section-heading">Edit Profile</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 'var(--space-lg)' }}>
                Update your display name below. Contact an administrator to change your email or role.
              </p>

              <div className="form-group">
                <label htmlFor="profile-name" className="form-label">Full Name</label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={saving}
                  autoFocus
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Read-only fields */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email ?? ''}
                  disabled
                  aria-readonly="true"
                />
                <span className="form-error" style={{ color: 'var(--clr-text-muted)' }}>
                  Email cannot be changed here.
                </span>
              </div>

              <div className="profile-edit-actions">
                <button
                  id="btn-save-profile"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner" />
                      Saving…
                    </>
                  ) : (
                    '✓ Save Changes'
                  )}
                </button>
                <button
                  id="btn-cancel-edit"
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
