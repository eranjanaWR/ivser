import React, { useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Alert
} from '@mui/material';
import {
  Phone,
  Email,
  Language,
  LocationOn,
  Map
} from '@mui/icons-material';

function ContactAgentForm({ companies = [] }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);

  const selectedCompany = useMemo(() => {
    return companies.find(
      (company) => String(company._id) === String(selectedCompanyId)
    );
  }, [companies, selectedCompanyId]);

  const branches = selectedCompany?.branches || [];

  const handleCompanyChange = (event) => {
    setSelectedCompanyId(event.target.value);
    setSelectedBranch(null);
  };

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleGoogleMaps = (branch) => {
    if (branch.googlePlaceId) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${branch.googlePlaceId}`,
        '_blank'
      );
      return;
    }

    if (branch.latitude && branch.longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`,
        '_blank'
      );
      return;
    }

    if (branch.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`,
        '_blank'
      );
    }
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', mb: 2 }}
      >
        Select a finance company to view its contact details and branches.
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Finance Company</InputLabel>

        <Select
          value={selectedCompanyId}
          label="Select Finance Company"
          onChange={handleCompanyChange}
        >
          {companies.length === 0 ? (
            <MenuItem disabled>
              No finance companies available
            </MenuItem>
          ) : (
            companies.map((company) => (
              <MenuItem
                key={company._id}
                value={company._id}
              >
                {company.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {selectedCompany && (
        <Card variant="outlined">
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              {selectedCompany.name}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {selectedCompany.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone color="primary" />
                  <Typography>
                    {selectedCompany.phone}
                  </Typography>
                </Box>
              )}

              {selectedCompany.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email color="primary" />
                  <Typography>
                    {selectedCompany.email}
                  </Typography>
                </Box>
              )}

              {selectedCompany.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Language color="primary" />
                  <Typography
                    component="a"
                    href={
                      selectedCompany.website.startsWith('http')
                        ? selectedCompany.website
                        : `https://${selectedCompany.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: 'none' }}
                  >
                    {selectedCompany.website}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Branches
            </Typography>

            {branches.length === 0 ? (
              <Alert severity="info">
                No branch locations are available for this finance company.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {branches.map((branch, index) => (
                  <Card
                    key={branch._id || `${branch.branchName}-${index}`}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: '0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => handleBranchClick(branch)}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {branch.branchName}
                      </Typography>

                      {branch.address && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 1
                          }}
                        >
                          <LocationOn color="primary" fontSize="small" />
                          <Typography variant="body2">
                            {branch.address}
                          </Typography>
                        </Box>
                      )}

                      {branch.phone && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2
                          }}
                        >
                          <Phone color="primary" fontSize="small" />
                          <Typography variant="body2">
                            {branch.phone}
                          </Typography>
                        </Box>
                      )}

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Map />}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleGoogleMaps(branch);
                        }}
                      >
                        View on Google Maps
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {selectedBranch && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 2 }}
                >
                  Selected Branch
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  {selectedBranch.branchName} selected.
                </Alert>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedBranch.phone && (
                    <Button
                      variant="contained"
                      startIcon={<Phone />}
                      onClick={() => handleCall(selectedBranch.phone)}
                    >
                      Call Branch
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<Map />}
                    onClick={() => handleGoogleMaps(selectedBranch)}
                  >
                    View on Google Maps
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default ContactAgentForm;