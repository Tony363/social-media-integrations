import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Share as ShareIcon, 
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../services/api';

const Posts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/posts/');
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    try {
      await api.delete(`/posts/${postToDelete.id}`);
      setPosts(posts.filter(post => post.id !== postToDelete.id));
      setSuccessMessage('Post deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  const getFilteredPosts = () => {
    switch (tabValue) {
      case 0: // All posts
        return posts;
      case 1: // Published
        return posts.filter(post => post.status === 'published');
      case 2: // Scheduled
        return posts.filter(post => post.status === 'scheduled');
      case 3: // Failed
        return posts.filter(post => post.status === 'failed');
      default:
        return posts;
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'published':
        return <Chip icon={<CheckCircleIcon />} label="Published" color="success" size="small" />;
      case 'scheduled':
        return <Chip icon={<ScheduleIcon />} label="Scheduled" color="primary" size="small" />;
      case 'failed':
        return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Your Posts
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mr: 2 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<ShareIcon />}
            onClick={() => navigate('/create-post')}
          >
            Create New Post
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Posts" />
          <Tab label="Published" />
          <Tab label="Scheduled" />
          <Tab label="Failed" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : getFilteredPosts().length > 0 ? (
        <Grid container spacing={3}>
          {getFilteredPosts().map((post) => (
            <Grid item xs={12} md={6} key={post.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    {getStatusChip(post.status)}
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.created_at)}
                    </Typography>
                  </Box>
                  
                  {post.title && (
                    <Typography variant="h6" gutterBottom>
                      {post.title}
                    </Typography>
                  )}
                  
                  <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                    {post.content}
                  </Typography>
                  
                  {post.media_urls && post.media_urls.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Media:
                      </Typography>
                      {post.media_urls.slice(0, 3).map((url, index) => (
                        <Chip
                          key={index}
                          label={`Media ${index + 1}`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {post.media_urls.length > 3 && (
                        <Chip
                          label={`+${post.media_urls.length - 3} more`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                    </Box>
                  )}
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Posted to:
                    </Typography>
                    {post.platforms.map((platform) => (
                      <Chip
                        key={platform}
                        label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  
                  {post.schedule_date && (
                    <Typography variant="body2" color="text.secondary">
                      Scheduled for: {formatDate(post.schedule_date)}
                    </Typography>
                  )}
                  
                  {post.tags && post.tags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {post.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={`#${tag}`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <Divider />
                <CardActions>
                  <Box sx={{ ml: 'auto' }}>
                    <Tooltip title="Delete Post">
                      <IconButton 
                        color="error"
                        onClick={() => handleDeleteClick(post)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            {tabValue === 0 
              ? "You haven't created any posts yet."
              : `You don't have any ${['', 'published', 'scheduled', 'failed'][tabValue]} posts.`}
          </Typography>
          <Button 
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={() => navigate('/create-post')}
          >
            Create Your First Post
          </Button>
        </Paper>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Posts;