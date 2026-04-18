import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Paper,
  useTheme
} from '@mui/material';
import { Close as CloseIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ✅ Default coordinates for Sri Lankan Districts
const DISTRICT_CENTERS = {
  'Colombo': [6.9271, 79.8612],
  'Gampaha': [7.0840, 80.0098],
  'Kalutara': [6.5854, 79.9607],
  'Kandy': [7.2906, 80.6337],
  'Matale': [7.4675, 80.6234],
  'Nuwara Eliya': [6.9497, 80.7891],
  'Galle': [6.0535, 80.2210],
  'Matara': [5.9549, 80.5550],
  'Hambantota': [6.1246, 81.1185],
  'Jaffna': [9.6615, 80.0255],
  'Kilinochchi': [9.3803, 80.3992],
  'Mannar': [8.9810, 79.9044],
  'Vavuniya': [8.7542, 80.4982],
  'Mullaitivu': [9.2671, 80.8143],
  'Batticaloa': [7.7302, 81.6747],
  'Ampara': [7.2912, 81.6724],
  'Trincomalee': [8.5873, 81.2152],
  'Kurunegala': [7.4817, 80.3609],
  'Puttalam': [8.0330, 79.8258],
  'Anuradhapura': [8.3114, 80.4037],
  'Polonnaruwa': [7.9403, 81.0188],
  'Badulla': [6.9934, 81.0550],
  'Moneragala': [6.8724, 81.3507],
  'Ratnapura': [6.6828, 80.3992],
  'Kegalle': [7.2513, 80.3464]
};

const DEFAULT_SRI_LANKA = [7.8731, 80.7718];

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

// Component to handle map centering and initialization
const MapInitializer = ({ initialLocation, open }) => {
  const map = useMap();
  
  // Use a ref to track if we've already initialized for this specific open/location combo
  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (open && initialLocation && initialLocation[0] && !initializedRef.current) {
      console.log('🗺️ [MAP INIT] Centering on:', initialLocation);
      map.setView([initialLocation[0], initialLocation[1]], 15);
      initializedRef.current = true;
    }
    
    // Reset ref when modal closes so it can re-init next time it opens
    if (!open) {
      initializedRef.current = false;
    }
  }, [open, initialLocation, map]);

  return null;
};

const LocationPickerModal = ({ open, onClose, onConfirm, initialLocation, district }) => {
  const theme = useTheme();
  
  // Internal marker position - initialized from props but then independent
  const [position, setPosition] = useState(DEFAULT_SRI_LANKA);
  
  // ✅ NEW: Track if we've already synced the initial location for this session
  const hasSyncedRef = React.useRef(false);

  // Sync internal position ONLY ONCE when modal opens
  useEffect(() => {
    if (open && !hasSyncedRef.current) {
      console.log('📍 [MARKER INIT] Setting initial marker position...');
      if (initialLocation && initialLocation[0] && initialLocation[1]) {
        setPosition([parseFloat(initialLocation[0]), parseFloat(initialLocation[1])]);
      } else if (district && DISTRICT_CENTERS[district]) {
        setPosition(DISTRICT_CENTERS[district]);
      } else {
        setPosition(DEFAULT_SRI_LANKA);
      }
      hasSyncedRef.current = true;
    }

    // Reset when modal closes so it can re-sync next time it opens for a new town
    if (!open) {
      hasSyncedRef.current = false;
    }
  }, [open, initialLocation, district]);

  const handleConfirm = () => {
    onConfirm(position);
    onClose();
  };

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: '600px' },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 0,
    borderRadius: 2,
    overflow: 'hidden',
    outline: 'none'
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="location-picker-title">
      <Box sx={style}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Typography id="location-picker-title" variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon /> Select Exact Location
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          {(!initialLocation || !initialLocation[0]) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Location not found precisely. Please click on the map to set your location manually.
            </Alert>
          )}
          
          <Typography variant="caption" display="block" sx={{ mb: 1, color: 'text.secondary' }}>
            Current Selection: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </Typography>

          <Paper variant="outlined" sx={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
            <MapContainer 
              center={position || DEFAULT_SRI_LANKA} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapInitializer initialLocation={position} open={open} />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" fullWidth onClick={handleConfirm} sx={{ fontWeight: 600 }}>
              Confirm Location
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default LocationPickerModal;
