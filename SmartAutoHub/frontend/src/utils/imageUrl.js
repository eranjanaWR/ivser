/**
 * Image URL Helper
 * Converts relative image paths to full URLs for backend serving
 */

/**
 * Get full image URL for displaying vehicle photos
 * @param {string} imagePath - Relative path like "uploads/filename.jpg" or full URL
 * @returns {string} - Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/placeholder-car.jpg';
  }
  
  // If it's already a full URL (starts with http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a local placeholder, return as-is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Get backend URL from environment or use default
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Prepend backend URL to relative paths
  // Handle paths that may or may not start with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${backendUrl}${normalizedPath}`;
};

export default getImageUrl;
