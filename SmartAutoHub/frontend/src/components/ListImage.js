/**
 * Simple Image Component for list views
 * Displays images without watermarking for better performance
 * Use this instead of WatermarkedImage for thumbnails and list views
 */

import React, { useState } from 'react';
import { Box } from '@mui/material';

const ListImage = ({
  src,
  alt,
  sx = {},
  fallbackSrc = null,
  ...props
}) => {
  const [error, setError] = useState(false);

  const handleImageError = () => {
    setError(true);
  };

  return (
    <Box
      component="img"
      src={error ? (fallbackSrc || '/images/placeholder.png') : (src || fallbackSrc)}
      alt={alt}
      onError={handleImageError}
      sx={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'cover',
        ...sx,
      }}
      {...props}
    />
  );
};

export default ListImage;
