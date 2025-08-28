import { UserLevel, UserRole, DashboardPermissions } from '../types/dashboard';

export const getPermissions = (userRole: UserRole): DashboardPermissions => {
  const isSysAdmin = userRole === 'sys-admin'; // Only sys-admin has full control
  const isManager = userRole === 'Manager' || userRole === 'ICT Manager'; // Managers have some privileges

  return {
    canView: true, // All users can view
    canCreate: isSysAdmin || isManager, // Only sys-admin and managers can create
    canUpdate: isSysAdmin || isManager, // Only sys-admin and managers can update
    canDelete: isSysAdmin, // Only sys-admin can delete
  };
};

export const canAccessFactory = (
  userLevel: UserLevel,
  factoryId: string,
  userFactoryId?: string
): boolean => {
  if (userLevel === "ADMIN" || userLevel === "NATIONAL") return true; // National and Admin can access all factories
  if (userLevel === "REGIONAL") {
    // Assume userFactoryId contains region-level factory access control
    return true; // You may need to check if the factory belongs to the user's region
  }
  if (userLevel === "FACTORY") {
    return factoryId === userFactoryId; // Factory users can only access their assigned factory
  }
  return false;
};

export const canAccessRegion = (
  userLevel: UserLevel,
  regionId: string,
  userRegionId?: string
): boolean => {
  if (userLevel === "ADMIN" || userLevel === "NATIONAL") return true; // Admins & National users can access all regions
  if (userLevel === "REGIONAL") {
    return regionId === userRegionId; // Regional users can access their own region
  }
  return false;
};
