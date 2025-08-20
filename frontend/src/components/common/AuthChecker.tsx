import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../../utils/auth';
import Auth from '../../pages/Auth';

interface AuthCheckerProps {
  children: React.ReactNode;
}

const AuthChecker: React.FC<AuthCheckerProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsChecking(true);
      setAuthError(null);
      
      // First test if backend is reachable
      try {
        const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
        const healthUrl = API_BASE_URL.replace('/api', '/health');
        const healthResponse = await fetch(healthUrl);
        if (!healthResponse.ok) {
          setAuthError('Backend server is not responding. Please start the backend server.');
          return;
        }
      } catch (error) {
        setAuthError('Cannot connect to backend server. Please ensure it\'s running.');
        return;
      }
      
      // Check if user has a valid token
      if (auth.isAuthenticated()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setAuthError('Connection failed. Please refresh the page.');
      console.error('Auth check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-red-800 dark:text-red-300 font-medium">Connection Error</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{authError}</p>
          <div className="space-y-2">
            <button
              onClick={checkAuth}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return <>{children}</>;
};

export default AuthChecker;