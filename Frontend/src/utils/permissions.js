export const ROLES = { USER: 'user', ADMIN: 'admin', SUPER_ADMIN: 'super_admin' };
const RANK = { user: 0, admin: 1, super_admin: 2 };
const rank = (r) => RANK[r] ?? -1;

export const atLeast = (actorRole, minRole) => rank(actorRole) >= rank(minRole);

export const canCreateRole = (actorRole, targetRole) => {
  switch (targetRole) {
    case ROLES.SUPER_ADMIN: return actorRole === ROLES.SUPER_ADMIN;
    case ROLES.ADMIN:       return actorRole === ROLES.SUPER_ADMIN;
    case ROLES.USER:        return atLeast(actorRole, ROLES.USER);
    default:                return false;
  }
};

// Users can upload their own files
export const canUploadFiles     = (r) => atLeast(r, ROLES.USER);
export const canViewHistory     = (r) => atLeast(r, ROLES.USER);
export const canDeleteFile      = (r) => r === ROLES.SUPER_ADMIN;
export const canViewSessionMonitor = (r) => r === ROLES.SUPER_ADMIN;
export const canAccessAdminPanel   = (r) => atLeast(r, ROLES.ADMIN);
export const canAccessSuperPanel   = (r) => r === ROLES.SUPER_ADMIN;

export const roleLabel = (r) =>
  ({ user: 'User', admin: 'Admin', super_admin: 'Super Admin' }[r] ?? r);
