import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Phone,
  MyLocation,
  LocationOn,
} from '@mui/icons-material';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612,
};

const FinanceBranchMap = ({ companies = [] }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  };

  const selectBranch = (branch, company) => {
    setSelectedBranch({
      ...branch,
      companyName: company.name,
    });

    if (
      mapRef.current &&
      branch.latitude != null &&
      branch.longitude != null
    ) {
      mapRef.current.panTo({
        lat: branch.latitude,
        lng: branch.longitude,
      });

      mapRef.current.setZoom(15);
    }
  };

  const branches = companies.flatMap((company) =>
    (company.branches || [])
      .filter(
        (branch) =>
          branch.latitude != null &&
          branch.longitude != null
      )
      .map((branch) => ({
        ...branch,
        companyName: company.name,
        companyId: company.id || company._id,
      }))
  );

  if (loadError) {
    return (
      <Alert severity="error">
        Error loading Google Maps. Please check your Google Maps API key.
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Paper
        sx={{
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {branches.length === 0 ? (
        <Box sx={{ p: 4 }}>
          <Alert severity="info">
            No finance company branch locations are available yet.
          </Alert>
        </Box>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
              title="Your Location"
            />
          )}

          {branches.map((branch, index) => (
            <Marker
              key={`${branch.companyId}-${branch._id || index}`}
              position={{
                lat: branch.latitude,
                lng: branch.longitude,
              }}
              onClick={() => {
                const company = companies.find(
                  (item) =>
                    (item.id || item._id)?.toString() ===
                    branch.companyId?.toString()
                );

                selectBranch(branch, company || { name: branch.companyName });
              }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
              title={`${branch.companyName} - ${branch.branchName}`}
            />
          ))}

          {selectedBranch && (
            <InfoWindow
              position={{
                lat: selectedBranch.latitude,
                lng: selectedBranch.longitude,
              }}
              onCloseClick={() => setSelectedBranch(null)}
            >
              <Box sx={{ p: 1, minWidth: 220 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 0.5 }}
                >
                  {selectedBranch.companyName}
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ mb: 0.5 }}
                >
                  {selectedBranch.branchName}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">
                    {selectedBranch.address}
                  </Typography>
                </Box>

                {selectedBranch.phone && (
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    href={`tel:${selectedBranch.phone}`}
                  >
                    {selectedBranch.phone}
                  </Button>
                )}
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      )}

      {userLocation && (
        <Button
          variant="contained"
          startIcon={<MyLocation />}
          onClick={centerOnUser}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1,
          }}
        >
          My Location
        </Button>
      )}
    </Paper>
  );
};

export default FinanceBranchMap;
