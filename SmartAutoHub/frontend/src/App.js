/**
 * SmartAuto Hub - Main App Component
 * Professional, minimal UI (TakGaala.lk Branding)
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';

// Pages - Auth & General
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerificationPage from './pages/VerificationPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Pages - Vehicle CRUD
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import AddVehiclePage from './pages/AddVehiclePage';
import MyVehiclesPage from './pages/MyVehiclesPage';
import AuctionResultPage from './pages/AuctionResultPage';
import WishlistPage from './pages/WishlistPage';

// Pages - Features from Main Branch (Financials & Comparison)
import ComparisonPage from './pages/ComparisonPage';
import ComparePage from './pages/ComparePage';
import LeaseCalculatorPage from './pages/LeaseCalculatorPage';
import FinancialAidsPage from './pages/FinancialAidsPage';

// Pages - Your Features (Test Drive & Bidding)
import TestDrivesPage from './pages/TestDrivesPage';
import BookTestDrivePage from './pages/BookTestDrivePage';
import SellerAvailability from './pages/SellerAvailability';
import BiddingPage from './pages/BiddingPage';
import AuctionVehicleDetailsPage from './pages/AuctionVehicleDetailsPage';
import LiveAuctionDashboard from './pages/LiveAuctionDashboard';

// Pages - Advertising & Boosting
import BoostAdPage from './pages/BoostAdPage';
import PremiumPostsPage from './pages/PremiumPostsPage';
import AdvertisePackagesPage from './pages/AdvertisePackagesPage';

// Pages - Breakdown & Repair
import BreakdownPage from './pages/BreakdownPage';
import RepairmanMapPage from './pages/RepairmanMapPage';
import RepairmanDashboard from './pages/RepairmanDashboard';

// Pages - Prediction & Admin
import PredictionPage from './pages/PredictionPage';
import Admin1Dashboard from './pages/Admin1Dashboard';
import Admin2Dashboard from './pages/Admin2Dashboard';

// Professional UI Theme Settings
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2', dark: '#1565c0', contrastText: '#ffffff' },
    secondary: { main: '#424242', dark: '#1b1b1b', contrastText: '#ffffff' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#1a1a1a', secondary: '#666666' },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, padding: '10px 24px', boxShadow: 'none' } } },
    MuiCard: { styleOverrides: { root: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, border: '1px solid #e0e0e0' } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#ffffff', color: '#1a1a1a', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } } },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <ToastContainer 
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, paddingTop: '80px' }}>
              <Routes>
                {/* --- PUBLIC ROUTES --- */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                
                {/* Comparison & Financials (Merged) */}
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/compare-vehicles" element={<ComparisonPage />} />
                <Route path="/compare/:id" element={<ComparisonPage />} />
                <Route path="/lease-calculator" element={<LeaseCalculatorPage />} />
                <Route path="/financial-aids" element={<FinancialAidsPage />} />
                
                {/* Bidding Public Routes */}
                <Route path="/auction-vehicles/:id" element={<AuctionVehicleDetailsPage />} />
                
                {/* Advertising & Prediction */}
                <Route path="/prediction" element={<PredictionPage />} />
                <Route path="/premium-posts" element={<PremiumPostsPage />} />
                <Route path="/advertise-packages" element={<AdvertisePackagesPage />} />
                <Route path="/vehicles/:vehicleId/boost" element={<BoostAdPage />} />

                {/* --- PROTECTED ROUTES (Requires Login) --- */}
                <Route path="/verification" element={<PrivateRoute><VerificationPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/vehicles/saved" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
                <Route path="/add-vehicle" element={<PrivateRoute><AddVehiclePage /></PrivateRoute>} />
                
                {/* Seller & Admin specific Vehicles */}
                <Route path="/my-vehicles" element={<PrivateRoute roles={['seller', 'buyer/seller', 'admin1']}><MyVehiclesPage /></PrivateRoute>} />

                {/* Test Drive Routes */}
                <Route path="/test-drives" element={<PrivateRoute><TestDrivesPage /></PrivateRoute>} />
                <Route path="/book-test-drive/:vehicleId" element={<PrivateRoute><BookTestDrivePage /></PrivateRoute>} />
                <Route path="/seller-availability" element={<PrivateRoute roles={['seller', 'buyer/seller', 'admin1']}><SellerAvailability /></PrivateRoute>} />

                {/* Bidding Protected Routes */}
                <Route path="/bidding" element={<PrivateRoute><BiddingPage /></PrivateRoute>} />
                <Route path="/bidding/:vehicleId/place-bid" element={<PrivateRoute><LiveAuctionDashboard /></PrivateRoute>} />
                <Route path="/bidding/:vehicleId" element={<PrivateRoute><LiveAuctionDashboard /></PrivateRoute>} />
                <Route path="/auction-result/:vehicleId" element={<PrivateRoute><AuctionResultPage /></PrivateRoute>} />

                {/* Breakdown Services */}
                <Route path="/breakdown" element={<PrivateRoute><BreakdownPage /></PrivateRoute>} />
                <Route path="/repairman-map" element={<PrivateRoute><RepairmanMapPage /></PrivateRoute>} />
                <Route path="/repairman-dashboard" element={<PrivateRoute roles={['repairman']}><RepairmanDashboard /></PrivateRoute>} />
                
                {/* Admin Management */}
                <Route path="/admin1" element={<PrivateRoute roles={['admin1']}><Admin1Dashboard /></PrivateRoute>} />
                <Route path="/admin2" element={<PrivateRoute roles={['admin2', 'admin1']}><Admin2Dashboard /></PrivateRoute>} />
                
                {/* 404 Not Found */}
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