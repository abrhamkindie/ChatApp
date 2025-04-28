import { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { Base_Url } from '../../API';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for token and validate on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Validate token by fetching user profile
          const res = await axios.get(`${Base_Url}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
           setCurrentUser({
            userId: res.data.userId,
            username: res.data.username,
            email: res.data.email,
            bio: res.data.bio,
            profilePicture: res.data.profilePicture
          });
        } catch (err) {
          console.error('Auth check error:', err.response?.data || err.message);
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${Base_Url}/auth/login`, { email, password });
       localStorage.setItem('token', res.data.token);
      setCurrentUser({
        userId: res.data.userId,
        username: res.data.username
      });
      return { success: true };
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};