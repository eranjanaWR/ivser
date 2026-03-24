/**
 * Navbar Component
 * Professional, minimal navigation bar - Uber-like design
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar,
  Build,
  Schedule,
  Person,
  Dashboard,
  Logout,
  Login,
  PersonAdd,
  TrendingUp,
  Home,
  VerifiedUser,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  // Navigation items
  const navItems = [
    { label: 'Vehicles', path: '/vehicles', icon: <DirectionsCar /> },
    { label: 'Price Prediction', path: '/prediction', icon: <TrendingUp /> },
  ];

  const authNavItems = [
    { label: 'Test Drives', path: '/test-drives', icon: <Schedule /> },
    { label: 'Breakdown Assist', path: '/breakdown', icon: <Build /> },
  ];

  const sellerNavItems = [
    { label: 'My Vehicles', path: '/my-vehicles', icon: <DirectionsCar /> },
    { label: 'Add Vehicle', path: '/add-vehicle', icon: <DirectionsCar /> },
  ];

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 260, pt: 2 }}>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          SmartAuto Hub
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button component={Link} to="/" onClick={handleDrawerToggle}>
          <ListItemIcon><Home /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.path} 
            component={Link} 
            to={item.path}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        {isAuthenticated && authNavItems.map((item) => (
          <ListItem 
            button 
            key={item.path} 
            component={Link} 
            to={item.path}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        {isAuthenticated && (
          <ListItem 
            button 
            component={Link} 
            to="/add-vehicle"
            onClick={handleDrawerToggle}
          >
            <ListItemIcon><DirectionsCar /></ListItemIcon>
            <ListItemText primary="Sell Vehicle" sx={{ fontWeight: 600 }} />
          </ListItem>
        )}
        {isAuthenticated && (user?.role === 'seller' || user?.role === 'admin1') && 
          sellerNavItems.map((item) => (
            <ListItem 
              button 
              key={item.path} 
              component={Link} 
              to={item.path}
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))
        }
      </List>
      <Divider />
      <List>
        {isAuthenticated ? (
          <>
            <ListItem button component={Link} to="/profile" onClick={handleDrawerToggle}>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            {['admin1', 'admin2'].includes(user?.role) && (
              <ListItem 
                button 
                component={Link} 
                to={user?.role === 'admin1' ? '/admin1' : '/admin2'}
                onClick={handleDrawerToggle}
              >
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
            )}
            <ListItem button onClick={() => { handleLogout(); handleDrawerToggle(); }}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button component={Link} to="/login" onClick={handleDrawerToggle}>
              <ListItemIcon><Login /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button component={Link} to="/signup" onClick={handleDrawerToggle}>
              <ListItemIcon><PersonAdd /></ListItemIcon>
              <ListItemText primary="Sign Up" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <DirectionsCar />
              SmartAuto Hub
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  color="inherit"
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
              {isAuthenticated && authNavItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  color="inherit"
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
              {isAuthenticated && (
                <Button
                  component={Link}
                  to="/add-vehicle"
                  color="inherit"
                  startIcon={<DirectionsCar />}
                  sx={{ fontWeight: 600 }}
                >
                  Sell Vehicle
                </Button>
              )}
            </Box>
          )}

          {/* Auth Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                {!user?.isFullyVerified && (
                  <Chip
                    icon={<VerifiedUser />}
                    label="Verify Account"
                    component={Link}
                    to="/verification"
                    clickable
                    color="warning"
                    size="small"
                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                  />
                )}
                <IconButton onClick={handleProfileMenuOpen}>
                  <Avatar
                    src={user?.profileImage}
                    sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                  >
                    {user?.firstName?.[0]}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {user?.firstName} {user?.lastName}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                    Profile
                  </MenuItem>
                  {(user?.role === 'seller' || user?.role === 'admin1') && (
                    <MenuItem component={Link} to="/my-vehicles" onClick={handleMenuClose}>
                      <ListItemIcon><DirectionsCar fontSize="small" /></ListItemIcon>
                      My Vehicles
                    </MenuItem>
                  )}
                  {['admin1', 'admin2'].includes(user?.role) && (
                    <MenuItem 
                      component={Link} 
                      to={user?.role === 'admin1' ? '/admin1' : '/admin2'} 
                      onClick={handleMenuClose}
                    >
                      <ListItemIcon><Dashboard fontSize="small" /></ListItemIcon>
                      Admin Dashboard
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              !isMobile && (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    color="inherit"
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/signup"
                    variant="contained"
                    color="primary"
                  >
                    Sign Up
                  </Button>
                </>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
