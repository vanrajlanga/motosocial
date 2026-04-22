import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Login } from './pages/Login';
import { validateSession, isAuthenticated, signUp } from './utils/authService';
import { loadAPIKeys } from './utils/apiService';
import { loadFacebookPages } from './utils/facebookService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const isValid = await validateSession();
        if (isValid) {
          setIsLoggedIn(true);
          // Load user data from cloud
          await loadAPIKeys();
          await loadFacebookPages();
        } else {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    // Load user data from cloud after login
    await loadAPIKeys();
    await loadFacebookPages();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <RouterProvider router={router} />;
}