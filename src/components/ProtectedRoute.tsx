import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserLevel } from '@/types/dashboard';
import apiClient from '@/apiclient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel?: UserLevel;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredLevel }) => {
  const { isAuthenticated, userData, setUserData, logout } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get("/api/v1/users/me/");
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !userData) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, userData, setUserData, logout]);

  if (!isAuthenticated || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (requiredLevel) {
    const levelHierarchy: Record<UserLevel, number> = {
      'UNAUTHORIZED': 0,
      'FACTORY': 1,
      'REGIONAL': 2,
      'NATIONAL': 3,
      'ADMIN': 4
    };

    const userLevel = userData.level as UserLevel;
    if (!levelHierarchy[userLevel] || levelHierarchy[userLevel] < levelHierarchy[requiredLevel]) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
