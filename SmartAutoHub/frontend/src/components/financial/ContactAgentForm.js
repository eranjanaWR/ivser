/**
 * Contact Agent Form
 * Form for contacting finance agents
 */

import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { Email, Phone } from '@mui/icons-material';

function ContactAgentForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would submit to backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });
    }, 3000);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
        Fill in your details to get contacted by a finance agent
      </Typography>

      {submitted && (
        <Alert severity="success">
          Thank you! An agent will contact you shortly.
        </Alert>
      )}

      <TextField
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
      />

      <TextField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> }}
      />

      <TextField
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} /> }}
      />

      <TextField
        label="Preferred Finance Company"
        name="company"
        value={formData.company}
        onChange={handleChange}
        fullWidth
        variant="outlined"
      />

      <TextField
        label="Message"
        name="message"
        value={formData.message}
        onChange={handleChange}
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Tell us about your financing needs..."
      />

      <Button
        type="submit"
        variant="contained"
        sx={{
          backgroundColor: '#1976d2',
          color: '#ffffff',
          fontWeight: 600,
          py: 1.5,
          '&:hover': { backgroundColor: '#1565c0' }
        }}
      >
        Request Agent Contact
      </Button>
    </Box>
  );
}

export default ContactAgentForm;
