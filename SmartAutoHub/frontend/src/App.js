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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotificationHistoryPage from './pages/NotificationHistoryPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import ComparisonPage from './pages/ComparisonPage';
import ComparePage from './pages/ComparePage';
import LeaseCalculatorPage from './pages/LeaseCalculatorPage';
import AddVehiclePage from './pages/AddVehiclePage';
import MyVehiclesPage from './pages/MyVehiclesPage';
import TestDrivesPage from './pages/TestDrivesPage';
import BookTestDrivePage from './pages/BookTestDrivePage';
import SellerAvailability from './pages/SellerAvailability';
import BreakdownPage from './pages/BreakdownPage';
import RepairmanMapPage from './pages/RepairmanMapPage';
import RepairmanDashboard from './pages/RepairmanDashboard';
import PredictionPage from './pages/PredictionPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import Admin1Dashboard from './pages/Admin1Dashboard';
import Admin2Dashboard from './pages/Admin2Dashboard';
import BoostAdPage from './pages/BoostAdPage';
import PremiumPostsPage from './pages/PremiumPostsPage';
import AdvertisePackagesPage from './pages/AdvertisePackagesPage';
import FinancialAidsPage from './pages/FinancialAidsPage';
import BiddingPage from './pages/BiddingPage';
import NotFoundPage from './pages/NotFoundPage';

// Professional, minimal theme similar to Uber
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Professional blue
      light: '#42a5f5',
      lighter: '#e3f2fd',
      50: '#e3f2fd',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424242', // Dark gray
      light: '#6d6d6d',
      lighter: '#eeeeee',
      50: '#f5f5f5',
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
      light: '#ef5350',
      lighter: '#ffebee',
      50: '#ffebee',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      lighter: '#e8f5e9',
      50: '#e8f5e9',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f57c00',
      light: '#ffb74d',
      lighter: '#fff3e0',
      50: '#fff3e0',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      lighter: '#e1f5fe',
      50: '#e1f5fe',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
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
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                <Route path="/vehicles/:vehicleId/boost" element={<BoostAdPage />} />
                <Route path="/lease-calculator" element={<LeaseCalculatorPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/compare-vehicles" element={<ComparisonPage />} />
                <Route path="/compare/:id" element={<ComparisonPage />} />
                <Route path="/prediction" element={<PredictionPage />} />
                <Route path="/premium-posts" element={<PremiumPostsPage />} />
                <Route path="/advertise-packages" element={<AdvertisePackagesPage />} />
                <Route path="/financial-aids" element={<FinancialAidsPage />} />
                
                {/* Protected Routes */}
                <Route path="/verification" element={
                  <PrivateRoute>
                    <VerificationPage />
                  </PrivateRoute>
                } />
                <Route path="/notifications" element={
                  <PrivateRoute>
                    <NotificationHistoryPage />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } />
                <Route path="/vehicles/saved" element={
                  <PrivateRoute>
                    <WishlistPage />
                  </PrivateRoute>
                } />
                <Route path="/add-vehicle" element={
                  <PrivateRoute>
                    <AddVehiclePage />
                  </PrivateRoute>
                } />
                <Route path="/my-vehicles" element={
                  <PrivateRoute roles={['seller', 'buyer/seller', 'admin1']}>
                    <MyVehiclesPage />
                  </PrivateRoute>
                } />
                <Route path="/test-drives" element={
                  <PrivateRoute>
                    <TestDrivesPage />
                  </PrivateRoute>
                } />
                <Route path="/book-test-drive/:vehicleId" element={
                  <PrivateRoute>
                    <BookTestDrivePage />
                  </PrivateRoute>
                } />
                <Route path="/seller-availability" element={
                  <PrivateRoute roles={['seller', 'buyer/seller', 'admin1']}>
                    <SellerAvailability />
                  </PrivateRoute>
                } />
                <Route path="/breakdown" element={
                  <PrivateRoute>
                    <BreakdownPage />
                  </PrivateRoute>
                } />
                <Route path="/bidding" element={
                  <BiddingPage />
                } />
                <Route path="/repairman-map" element={
                  <PrivateRoute>
                    <RepairmanMapPage />
                  </PrivateRoute>
                } />
                <Route path="/repairman-dashboard" element={
                  <PrivateRoute roles={['repairman']}>
                    <RepairmanDashboard />
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
