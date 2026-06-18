/**
 * Role utility — centralised permission logic for HelloTasks.
 *
 * Three-tier hierarchy (highest wins):
 *   project role  →  workspace role (globalRole)  →  defaultRole (viewer)
 *
 * Legacy role values are mapped to canonical names so old DB records keep working.
 */

// Maps old DB values to canonical role names
const ROLE_ALIASES = {
  super_admin:  'system_admin',
  project_lead: 'manager',
  developer:    'member',
};

// What each canonical role can do
const PERMISSIONS = {
  // Workspace management
  'workspace:edit':          ['owner', 'manager'],
  'workspace:archive':       ['owner'],
  'member:add':              ['owner', 'manager'],
  'member:remove':           ['owner', 'manager'],
  'member:change_role':      ['owner', 'manager'],
  // Project management
  'project:create':          ['owner', 'manager', 'quality_manager'],
  'project:edit':            ['owner', 'manager', 'quality_manager'],
  'project:archive':         ['owner', 'manager'],
  'project:delete':          ['owner'],
  // Tasks
  'task:create':             ['owner', 'manager', 'quality_manager', 'member'],
  'task:edit_any':           ['owner', 'manager'],
  'task:edit_assigned':      ['owner', 'manager', 'quality_manager', 'member'],
  'task:assign':             ['owner', 'manager', 'quality_manager'],
  'task:start':              ['owner', 'manager', 'quality_manager', 'member'],
  'task:add_note':           ['owner', 'manager', 'quality_manager', 'member'],
  'task:add_review_note':    ['owner', 'manager', 'quality_manager'],
  'task:submit':             ['owner', 'manager', 'quality_manager', 'member'],
  'task:approve':            ['owner', 'manager', 'quality_manager'],
  'task:return':             ['owner', 'manager', 'quality_manager'],
  'task:mark_blocked':       ['owner', 'manager', 'quality_manager', 'member'],
  'task:delete':             ['owner', 'manager'],
  // Reports
  'report:view':             ['owner', 'manager', 'quality_manager', 'member', 'viewer'],
  'report:export':           ['owner', 'manager', 'quality_manager', 'viewer'],
  // Admin (system-level only)
  'admin:settings':          ['system_admin'],
  'admin:user_management':   ['system_admin'],
};

// Display labels for all role values (old and new)
const ROLE_LABELS = {
  system_admin:    'System Admin',
  super_admin:     'System Admin',
  owner:           'Owner',
  manager:         'Manager',
  project_lead:    'Manager',
  quality_manager: 'Quality Manager',
  member:          'Member',
  developer:       'Member',
  viewer:          'Viewer',
};

// Canonical workspace roles in display order
const WORKSPACE_ROLES = ['owner', 'manager', 'quality_manager', 'member', 'viewer'];

// Named role sets — use these in controllers instead of inline arrays
const MANAGER_ROLES = ['project_lead', 'manager', 'owner'];
const ELEVATED_ROLES = ['system_admin', 'super_admin', 'owner', 'manager', 'project_lead', 'quality_manager'];
const ALL_PROJECT_ROLES = ['project_lead', 'manager', 'owner', 'quality_manager', 'developer', 'member', 'viewer'];

// Normalise a role value (old or new) to its canonical form
function normalizeRole(role) {
  return ROLE_ALIASES[role] || role || 'viewer';
}

// Check if a role has permission for an action
function can(role, action) {
  const r = normalizeRole(role);
  // system_admin and owner have access to everything in their scope
  if (r === 'system_admin') return true;
  return (PERMISSIONS[action] || []).includes(r);
}

// Check if a user object is a system admin (supports both old and new field)
function isSystemAdmin(user) {
  return user.systemRole === 'system_admin' || user.globalRole === 'super_admin' || user.globalRole === 'system_admin';
}

// Check if a user can manage a project (is owner/manager at project or workspace level)
function canManage(user, project) {
  if (isSystemAdmin(user)) return true;
  const projectRole = project.getMemberRole ? project.getMemberRole(user._id) : null;
  if (projectRole) {
    return ['project_lead', 'manager', 'owner'].includes(projectRole);
  }
  return ['owner', 'manager', 'project_lead'].includes(user.globalRole);
}

/**
 * Compute the effective role for a user in a given context.
 * Returns { scope: 'project'|'workspace'|'system'|'default', role: <canonical> } or null.
 *
 * effectiveRole = projectRole || workspaceRole || defaultRole
 */
async function getEffectiveRole({ userId, projectId } = {}) {
  const User    = require('../models/User');
  const Project = require('../models/Project');

  const user = await User.findById(userId).select('globalRole systemRole defaultRole accountStatus').lean();
  if (!user || user.accountStatus !== 'active') return null;

  // System admin always has owner-level effective role
  if (isSystemAdmin(user)) {
    return { scope: 'system', role: 'system_admin' };
  }

  // Check project membership first
  if (projectId) {
    const project = await Project.findById(projectId).select('members').lean();
    if (project) {
      const member = project.members.find(m => m.user.toString() === userId.toString());
      if (member) {
        return { scope: 'project', role: normalizeRole(member.role) };
      }
    }
  }

  // Fall back to workspace role (globalRole serves as workspace role in MVP)
  const workspaceRole = normalizeRole(user.globalRole);
  if (workspaceRole && workspaceRole !== 'viewer') {
    return { scope: 'workspace', role: workspaceRole };
  }

  // Final fallback — defaultRole is always viewer
  return { scope: 'default', role: 'viewer' };
}

module.exports = {
  ROLE_ALIASES,
  PERMISSIONS,
  ROLE_LABELS,
  WORKSPACE_ROLES,
  MANAGER_ROLES,
  ELEVATED_ROLES,
  ALL_PROJECT_ROLES,
  normalizeRole,
  can,
  isSystemAdmin,
  canManage,
  getEffectiveRole,
};
