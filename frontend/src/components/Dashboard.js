import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add as AddIcon, Share as ShareIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { AuthContext } from '../App';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    socialAccounts: 0,
    totalPosts: 0,
    scheduledPosts: 0,
    recentPosts: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      // Fetch social accounts
      let socialAccounts = [];
      let posts = [];
      
      // Load social accounts
      const loadSocialAccounts = async () => {
        const response = await api.get('/social-accounts/');
        return response.data;
      };
      
      // Load posts
      const loadPosts = async () => {
        const response = await api.get('/posts/');
        return response.data;
      };
      
      // Execute all requests
      try {
        [socialAccounts, posts] = await Promise.all([
          loadSocialAccounts(),
          loadPosts()
        ]);
        
        setStats({
          socialAccounts: socialAccounts.length,
          totalPosts: posts.length,
          scheduledPosts: posts.filter(post => post.status === 'scheduled').length,
          recentPosts: posts.slice(0, 5) // Get the 5 most recent posts
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.username}!
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Quick actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-post')}
            >
              New Post
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/social-accounts')}
            >
              Manage Accounts
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ShareIcon />}
              onClick={() => navigate('/posts')}
            >
              View All Posts
            </Button>
          </Paper>
        </Grid>
        
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Social Accounts
              </Typography>
              <Typography variant="h3" color="primary" sx={{ mt: 2 }}>
                {stats.socialAccounts}
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/social-accounts')}
              >
                Manage Accounts
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Total Posts
              </Typography>
              <Typography variant="h3" color="primary" sx={{ mt: 2 }}>
                {stats.totalPosts}
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/posts')}
              >
                View Posts
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Scheduled Posts
              </Typography>
              <Typography variant="h3" color="primary" sx={{ mt: 2 }}>
                {stats.scheduledPosts}
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button size="small" onClick={() => navigate('/posts')}>
                View Schedule
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Posts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Recent Posts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {stats.recentPosts.length > 0 ? (
              stats.recentPosts.map((post) => (
                <Box key={post.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Posted to: {post.platforms.join(', ')} • {new Date(post.created_at).toLocaleString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary">
                No posts yet. Create your first post to get started!
              </Typography>
            )}
            
            {stats.totalPosts > 5 && (
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button onClick={() => navigate('/posts')}>
                  View All Posts
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Getting Started */}
        {stats.socialAccounts === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                Getting Started
              </Typography>
              <Typography variant="body1" paragraph>
                To start posting to social media, you need to connect your accounts first.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/social-accounts')}
              >
                Connect Social Media Accounts
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;