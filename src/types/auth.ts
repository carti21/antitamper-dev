export type UserRole = 'sys-admin' | 'Manager' | 'ICT Manager' | 'FUM' | 'FS' | 'user';
export type UserLevel = 'FACTORY' | 'REGIONAL' | 'NATIONAL' | 'ADMIN';


export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: {
    canViewDashboard: boolean;
    canManageUsers: boolean;
    canManageDevices: boolean;
    canManageFactories: boolean;
    canViewLogs: boolean;
    canManageAlerts: boolean;
  };
}

export const rolePermissions: Record<UserRole, User['permissions']> = {
  'sys-admin': {
    canViewDashboard: true,
    canManageUsers: true,
    canManageDevices: true,
    canManageFactories: true,
    canViewLogs: true,
    canManageAlerts: true,
  },
  'Manager': {
    canViewDashboard: true,
    canManageUsers: false,
    canManageDevices: false,
    canManageFactories: false,
    canViewLogs: true,
    canManageAlerts: false,
  },
  'ICT Manager': {
    canViewDashboard: true,
    canManageUsers: false,
    canManageDevices: false,
    canManageFactories: false,
    canViewLogs: true,
    canManageAlerts: false,
  },
  'FUM': {
    canViewDashboard: true,
    canManageUsers: false,
    canManageDevices: false,
    canManageFactories: false,
    canViewLogs: true,
    canManageAlerts: false,
  },
  'FS': {
    canViewDashboard: true,
    canManageUsers: false,
    canManageDevices: false,
    canManageFactories: false,
    canViewLogs: true,
    canManageAlerts: false,
  },
  'user': {
    canViewDashboard: true,
    canManageUsers: false,
    canManageDevices: false,
    canManageFactories: false,
    canViewLogs: false,
    canManageAlerts: false,
  }
};
