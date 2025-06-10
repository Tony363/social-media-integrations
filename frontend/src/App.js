import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Import components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import SocialAccounts from './components/SocialAccounts';
import CreatePost from './components/CreatePost';
import Posts from './components/Posts';
import Navigation from './components/Navigation';
import api from './services/api';

// Create authentication context
export const AuthContext = createContext();

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Verify token by getting current user
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/users/me/');
          setUser(response.data);
        } catch (error) {
          // If token is invalid or expired
          console.error('Auth initialization error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!token) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ token, user, login, logout }}>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />
                
                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/social-accounts"
                  element={
                    <ProtectedRoute>
                      <SocialAccounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-post"
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/posts"
                  element={
                    <ProtectedRoute>
                      <Posts />
                    </ProtectedRoute>
                  }
                />
                
                {/* Default redirects */}
                <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
                <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
              </Routes>
            </Container>
            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
              <Container maxWidth="sm">
                <Box sx={{ textAlign: 'center' }}>
                  Social Media Manager &copy; {new Date().getFullYear()}
                </Box>
              </Container>
            </Box>
          </Box>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;