import React from 'react';
// import { UserLevel } from '@/types/auth';
import FactoryDashboard from './FactoryDashboard';
import RegionalDashboard from './RegionalDashboard';
import NationalDashboard from './NationalDashboard';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router';

type DashboardProps = object;

const Dashboard: React.FC<DashboardProps> = () => {
  const { isAuthenticated, userData } = useAuth();

  if (!isAuthenticated || !userData) {
    return <Navigate to="/login" replace />;
  }

  if (!userData.role || !userData.level) {
    return <Navigate to="/unauthorized" replace />;
  }

  const renderDashboard = () => {
    switch (userData.level) {
      case 'FACTORY':
        return <FactoryDashboard  />;
      case 'REGIONAL':
        return <RegionalDashboard  />;
      case 'NATIONAL':
        return <NationalDashboard  />;
      case 'ADMIN':
        return <AdminDashboard  />;
      default:
        return <Navigate to="/unauthorized" replace />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
