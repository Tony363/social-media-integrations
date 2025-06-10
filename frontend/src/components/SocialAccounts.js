import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import api from '../services/api';

const SocialAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    platform: '',
    api_key: '',
    profile_key: ''
  });
  const [supportedPlatforms, setSupportedPlatforms] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchSupportedPlatforms();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    
    const response = await api.get('/social-accounts/');
    if (response.status === 200) {
      setAccounts(response.data);
      setError('');
    } else {
      setError('Failed to load social accounts. Please try again.');
    }
    
    setLoading(false);
  };

  const fetchSupportedPlatforms = async () => {
    const response = await api.get('/platforms');
    if (response.status === 200) {
      setSupportedPlatforms(response.data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormData({
      platform: '',
      api_key: '',
      profile_key: ''
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    if (!formData.platform || !formData.api_key) {
      setError('Platform and API Key are required.');
      return;
    }

    setLoading(true);
    setError('');
    
    const response = await api.post('/social-accounts/', formData);
    if (response.status === 200 || response.status === 201) {
      setSuccessMessage('Social media account added successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      await fetchAccounts();
      handleCloseDialog();
    } else {
      setError('Failed to add social account. Please try again.');
    }
    
    setLoading(false);
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this social account?')) {
      return;
    }

    setLoading(true);
    setError('');
    
    const response = await api.delete(`/social-accounts/${accountId}`);
    if (response.status === 200) {
      setSuccessMessage('Social account deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      await fetchAccounts();
    } else {
      setError('Failed to delete social account. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Social Media Accounts
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleOpenDialog}
        >
          Connect New Account
        </Button>
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
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Ayrshare API Integration
        </Typography>
        <Typography variant="body1" paragraph>
          To post to social media platforms, you need to connect your Ayrshare API key. 
          This allows our application to post content on your behalf to multiple social networks.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Don't have an Ayrshare account yet? 
          <Button 
            variant="text" 
            href="https://www.ayrshare.com" 
            target="_blank"
            sx={{ ml: 1 }}
          >
            Sign up for Ayrshare
          </Button>
        </Typography>
      </Paper>
      
      <Typography variant="h5" sx={{ mb: 2 }}>
        Your Connected Accounts
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : accounts.length > 0 ? (
        <Grid container spacing={3}>
          {accounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="h2">
                      {account.platform}
                    </Typography>
                    <Tooltip title="API Key is stored securely">
                      <InfoIcon color="action" fontSize="small" />
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    API Key: •••••••••{account.api_key.slice(-4)}
                  </Typography>
                  {account.profile_key && (
                    <Typography variant="body2" color="text.secondary">
                      Profile Key: •••••••••{account.profile_key.slice(-4)}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Connected on {new Date(account.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenDialog()}
                  >
                    Update
                  </Button>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteAccount(account.id)}
                    sx={{ marginLeft: 'auto' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You haven't connected any social media accounts yet.
          </Typography>
          <Button 
            variant="contained"
            onClick={handleOpenDialog}
          >
            Connect Your First Account
          </Button>
        </Paper>
      )}
      
      {/* Add/Edit Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Connect Social Media Account
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="platform-label">Platform</InputLabel>
              <Select
                labelId="platform-label"
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                label="Platform"
              >
                {supportedPlatforms.map((platform) => (
                  <MenuItem key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              fullWidth
              id="api_key"
              name="api_key"
              label="Ayrshare API Key"
              type="password"
              value={formData.api_key}
              onChange={handleInputChange}
              helperText="Find your API key in the Ayrshare dashboard"
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="profile_key"
              name="profile_key"
              label="Ayrshare Profile Key (Optional)"
              type="password"
              value={formData.profile_key}
              onChange={handleInputChange}
              helperText="Required for Business Plans only"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialAccounts;