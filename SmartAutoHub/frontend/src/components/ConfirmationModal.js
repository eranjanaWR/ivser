import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

/**
 * Reusable Confirmation Modal using MUI Dialog
 * Provides backdrop overlay and focus trapping automatically.
 */
const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary', // 'primary', 'success', 'danger'
}) => {
  // Determine colors based on type
  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgcolor: '#4caf50',
          '&:hover': { bgcolor: '#388e3c' },
        };
      case 'danger':
        return {
          bgcolor: '#d32f2f',
          '&:hover': { bgcolor: '#c62828' },
        };
      default:
        return {
          bgcolor: '#1976d2',
          '&:hover': { bgcolor: '#1565c0' },
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ color: '#4caf50', fontSize: 40, mb: 2 }} />;
      case 'danger':
        return <WarningIcon sx={{ color: '#d32f2f', fontSize: 40, mb: 2 }} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: 1,
          minWidth: 400,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={onClose} size="small" sx={{ m: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
        {getIcon()}
        <Typography id="confirmation-modal-title" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <DialogContentText id="confirmation-modal-description" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, gap: 2 }}>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            ...getConfirmButtonStyles(),
            px: 4,
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          {confirmText}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            px: 4,
            fontWeight: 700,
            borderRadius: 2,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
          }}
        >
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
