/**
 * Watermarked Image Component
 * Displays an image with takgaala.lk watermark
 */

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getWatermarkedImage } from '../utils/watermark';

const WatermarkedImage = ({
  src,
  alt,
  sx = {},
  showLoader = true,
  fallbackSrc = null,
  ...props
}) => {
  const [watermarkedUrl, setWatermarkedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    getWatermarkedImage(src)
      .then(url => {
        setWatermarkedUrl(url);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to watermark image:', err);
        // Fallback to original image if watermarking fails
        setWatermarkedUrl(src);
        setLoading(false);
        setError(true);
      });
  }, [src]);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        ...sx,
      }}
    >
      {loading && showLoader && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <CircularProgress size={40} />
        </Box>
      )}
      <Box
        component="img"
        src={watermarkedUrl || src || fallbackSrc}
        alt={alt}
        sx={{
          width: '100%',
          ...sx,
        }}
        {...props}
      />
    </Box>
  );
};

export default WatermarkedImage;
