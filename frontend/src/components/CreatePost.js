import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AddPhotoAlternate as ImageIcon, Close as CloseIcon } from '@mui/icons-material';
import api from '../services/api';

const CreatePost = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    platforms: [],
    mediaUrls: [],
    scheduleDate: null,
    title: '',
    tags: []
  });
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [mediaInput, setMediaInput] = useState('');
  
  useEffect(() => {
    fetchPlatforms();
  }, []);
  
  const fetchPlatforms = async () => {
    try {
      const response = await api.get('/platforms');
      setAvailablePlatforms(response.data);
    } catch (err) {
      console.error('Error fetching platforms:', err);
      setError('Could not load supported platforms. Please refresh and try again.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handlePlatformChange = (e) => {
    const platform = e.target.name;
    const checked = e.target.checked;
    
    if (checked) {
      setFormData({
        ...formData,
        platforms: [...formData.platforms, platform]
      });
    } else {
      setFormData({
        ...formData,
        platforms: formData.platforms.filter(p => p !== platform)
      });
    }
  };
  
  const handleAddMediaUrl = () => {
    if (mediaInput && isValidUrl(mediaInput)) {
      setFormData({
        ...formData,
        mediaUrls: [...formData.mediaUrls, mediaInput]
      });
      setMediaInput('');
    }
  };
  
  const handleRemoveMedia = (index) => {
    const updatedMediaUrls = [...formData.mediaUrls];
    updatedMediaUrls.splice(index, 1);
    setFormData({
      ...formData,
      mediaUrls: updatedMediaUrls
    });
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      scheduleDate: date
    });
  };
  
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  const handleAddTag = () => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
      setTag('');
    }
  };
  
  const handleDeleteTag = (tagToDelete) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToDelete)
    });
  };
  
  const validateForm = () => {
    if (!formData.content) {
      setError('Post content is required');
      return false;
    }
    
    if (formData.platforms.length === 0) {
      setError('Select at least one social media platform');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const postData = {
        content: formData.content,
        platforms: formData.platforms,
        media_urls: formData.mediaUrls.length > 0 ? formData.mediaUrls : undefined,
        title: formData.title || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };
      
      // Add schedule date if set
      if (formData.scheduleDate) {
        postData.schedule_date = formData.scheduleDate.toISOString();
      }
      
      const response = await api.post('/posts/', postData);
      
      if (response.status === 201) {
        setSuccess(true);
        // Reset form after successful submission
        setFormData({
          content: '',
          platforms: [],
          mediaUrls: [],
          scheduleDate: null,
          title: '',
          tags: []
        });
        
        // Redirect to posts list after a brief delay
        setTimeout(() => {
          navigate('/posts');
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.detail || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Post
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>Post created successfully!</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Post Content */}
            <Grid item xs={12}>
              <TextField
                multiline
                rows={4}
                name="content"
                label="Post Content"
                value={formData.content}
                onChange={handleChange}
                fullWidth
                required
                placeholder="What would you like to share?"
                inputProps={{ maxLength: 280 }}
                helperText={`${formData.content.length}/280 characters`}
              />
            </Grid>
            
            {/* Post Title (Optional) */}
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Post Title (Optional)"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                placeholder="Add a title for your post"
              />
            </Grid>
            
            {/* Platform Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Platforms
              </Typography>
              <FormGroup row>
                {availablePlatforms.map((platform) => (
                  <FormControlLabel
                    key={platform}
                    control={
                      <Checkbox
                        checked={formData.platforms.includes(platform)}
                        onChange={handlePlatformChange}
                        name={platform}
                      />
                    }
                    label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  />
                ))}
              </FormGroup>
            </Grid>
            
            {/* Media URLs */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Add Media
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Media URL"
                  value={mediaInput}
                  onChange={(e) => setMediaInput(e.target.value)}
                  placeholder="Enter image or video URL"
                  error={mediaInput !== '' && !isValidUrl(mediaInput)}
                  helperText={mediaInput !== '' && !isValidUrl(mediaInput) ? 'Please enter a valid URL' : ''}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleAddMediaUrl} disabled={!mediaInput || !isValidUrl(mediaInput)}>
                          <ImageIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              {/* Display added media URLs */}
              {formData.mediaUrls.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {formData.mediaUrls.map((url, index) => (
                    <Chip
                      key={index}
                      label={`Media ${index + 1}`}
                      onDelete={() => handleRemoveMedia(index)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
            
            {/* Tags */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Add Tags (Optional)
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Enter a tag"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button 
                          onClick={handleAddTag}
                          disabled={!tag}
                        >
                          Add
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              {/* Display added tags */}
              {formData.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      onDelete={() => handleDeleteTag(tag)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
            
            {/* Schedule */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Schedule (Optional)
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Schedule Date & Time"
                  value={formData.scheduleDate}
                  onChange={handleDateChange}
                  minDateTime={new Date()}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || formData.platforms.length === 0 || !formData.content}
                >
                  {loading ? <CircularProgress size={24} /> : formData.scheduleDate ? 'Schedule Post' : 'Post Now'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreatePost;