import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserLevel } from '@/types/dashboard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel?: UserLevel;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredLevel,
  requiredRoles = []
}) => {
  const { isAuthenticated, userData } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user level requirements
  if (requiredLevel) {
    const levelHierarchy: Record<UserLevel, number> = {
      'UNAUTHORIZED': 0,
      'FACTORY': 1,
      'REGIONAL': 2,
      'NATIONAL': 3,
      'ADMIN': 4
    };

    // Map numeric levels to string levels if needed
    const numericToStringLevel: Record<string, UserLevel> = {
      '1': 'ADMIN',
      '2': 'NATIONAL',
      '3': 'REGIONAL',
      '4': 'FACTORY'
    };

    // Map backend roles to frontend levels
    const roleToLevel: Record<string, UserLevel> = {
      'sys-admin': 'ADMIN',
      'ICT Manager': 'ADMIN',
      'Manager': 'NATIONAL',
      'FUM': 'REGIONAL',
      'FSC': 'FACTORY'
    };
    
    // Map backend level strings to frontend level strings
    const levelStringMap: Record<string, UserLevel> = {
      'factory': 'FACTORY',
      'region': 'REGIONAL',
      'national': 'NATIONAL',
      'global': 'ADMIN'
    };

    // First check if userData.level is already a valid level
    let userLevel = userData.level as UserLevel;
    
    // If not a valid level or empty, try to determine from role
    if (!['ADMIN', 'NATIONAL', 'REGIONAL', 'FACTORY'].includes(userLevel)) {
      userLevel = roleToLevel[userData.role] || undefined;
      
      // If still not determined, try to map from level string
      if (!userLevel && userData.level) {
        if (typeof userData.level === 'string' && isNaN(Number(userData.level))) {
          // If it's a string like 'region', map to the correct level
          userLevel = levelStringMap[userData.level?.toLowerCase()] || (userData.level?.toUpperCase() as UserLevel);
        } else {
          // If it's numeric or numeric string like '3', map to string level
          userLevel = numericToStringLevel[userData.level] || 'UNAUTHORIZED';
        }
      }
    }
    
    // Final fallback
    if (!userLevel) {
      userLevel = 'UNAUTHORIZED';
    }
    if (!userLevel || levelHierarchy[userLevel] < levelHierarchy[requiredLevel]) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const userRole = userData.role;
    // Map frontend roles to backend roles
    const roleMap: Record<string, string[]> = {
      'Admin': ['sys-admin'],
      'Manager': ['Manager', 'FUM', 'FSC', 'ICT Manager']
    };

    // Check if user's role matches any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      roleMap[role]?.includes(userRole)
    );

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
