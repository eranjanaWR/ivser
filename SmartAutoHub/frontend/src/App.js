/**
 * SmartAuto Hub - Main App Component
 * Professional, minimal UI similar to Uber (clean layout, white/gray/black/blue accents)
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerificationPage from './pages/VerificationPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import AddVehiclePage from './pages/AddVehiclePage';
import MyVehiclesPage from './pages/MyVehiclesPage';
import TestDrivesPage from './pages/TestDrivesPage';
import BreakdownPage from './pages/BreakdownPage';
import RepairmanMapPage from './pages/RepairmanMapPage';
import PredictionPage from './pages/PredictionPage';
import ProfilePage from './pages/ProfilePage';
import Admin1Dashboard from './pages/Admin1Dashboard';
import Admin2Dashboard from './pages/Admin2Dashboard';
import NotFoundPage from './pages/NotFoundPage';

// Professional, minimal theme similar to Uber
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Professional blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424242', // Dark gray
      light: '#6d6d6d',
      dark: '#1b1b1b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5', // Light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    error: {
      main: '#d32f2f',
    },
    success: {
      main: '#2e7d32',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 12,
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, paddingTop: '80px' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                <Route path="/prediction" element={<PredictionPage />} />
                
                {/* Protected Routes */}
                <Route path="/verification" element={
                  <PrivateRoute>
                    <VerificationPage />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } />
                <Route path="/add-vehicle" element={
                  <PrivateRoute roles={['seller', 'admin1']}>
                    <AddVehiclePage />
                  </PrivateRoute>
                } />
                <Route path="/my-vehicles" element={
                  <PrivateRoute roles={['seller', 'admin1']}>
                    <MyVehiclesPage />
                  </PrivateRoute>
                } />
                <Route path="/test-drives" element={
                  <PrivateRoute>
                    <TestDrivesPage />
                  </PrivateRoute>
                } />
                <Route path="/breakdown" element={
                  <PrivateRoute>
                    <BreakdownPage />
                  </PrivateRoute>
                } />
                <Route path="/repairman-map" element={
                  <PrivateRoute>
                    <RepairmanMapPage />
                  </PrivateRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin1" element={
                  <PrivateRoute roles={['admin1']}>
                    <Admin1Dashboard />
                  </PrivateRoute>
                } />
                <Route path="/admin2" element={
                  <PrivateRoute roles={['admin2', 'admin1']}>
                    <Admin2Dashboard />
                  </PrivateRoute>
                } />
                
                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
