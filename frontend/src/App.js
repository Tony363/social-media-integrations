import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';

// Import components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import CreatePost from './components/CreatePost';
import SocialAccounts from './components/SocialAccounts';
import PostsList from './components/PostsList';

// Create authentication context
export const AuthContext = createContext();

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  // Update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  // Login function
  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ token, user, login, logout }}>
        <Router>
          <Navigation />
          <Container maxWidth="lg" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <Routes>
              <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/create-post" element={token ? <CreatePost /> : <Navigate to="/login" />} />
              <Route path="/social-accounts" element={token ? <SocialAccounts /> : <Navigate to="/login" />} />
              <Route path="/posts" element={token ? <PostsList /> : <Navigate to="/login" />} />
              
              {/* Redirect to dashboard if logged in, otherwise to login page */}
              <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            </Routes>
          </Container>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;