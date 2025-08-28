import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth(); 

  const handleGoBack = () => {
    if (isAuthenticated) {
      logout();
    }
    navigate('/login'); 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You do not have permission to access this page.
        </p>
        <div className="space-x-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={handleGoBack} // Use the handleGoBack function
            variant="default"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;