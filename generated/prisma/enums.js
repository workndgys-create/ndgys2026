// Runtime enum exports (generated copy of enums.ts for bundlers that look for .js)
export const RegistrationStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
};

export const AdminRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DIRECTOR: 'DIRECTOR',
  HR: 'HR',
  DEVELOPER: 'DEVELOPER',
  FINANCE_LEAD: 'FINANCE_LEAD',
  FINANCE_EXECUTIVE: 'FINANCE_EXECUTIVE',
  DELEGATE_AFFAIRS_LEAD: 'DELEGATE_AFFAIRS_LEAD',
  DELEGATE_AFFAIRS_EXECUTIVE: 'DELEGATE_AFFAIRS_EXECUTIVE',
  VOLUNTEER_COORDINATOR: 'VOLUNTEER_COORDINATOR',
  VOLUNTEER: 'VOLUNTEER'
};

export const RegSource = {
  online: 'online',
  offline: 'offline'
};

export const AnnouncementAudience = {
  ALL: 'ALL',
  PAID: 'PAID',
  MUN_ALL: 'MUN_ALL',
  TRACK: 'TRACK',
  COMPETITION_ALL: 'COMPETITION_ALL',
  COMPETITION: 'COMPETITION'
};

// re-export for convenience
export default {
  RegistrationStatus,
  AdminRole,
  RegSource,
  AnnouncementAudience
};
