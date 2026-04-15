/**
 * Image URL Helper
 * Converts relative image paths to full URLs for backend serving
 */

/**
 * Get full image URL for displaying vehicle photos
 * @param {string|object} imagePath - Relative path, Image object (with or without imageData), or full URL
 * @returns {string} - Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/images/placeholder.png';
  }
  
  // Handle Image objects with base64 data (from database detail view)
  if (typeof imagePath === 'object' && imagePath.imageData) {
    const mimeType = imagePath.mimeType || 'image/jpeg';
    return `data:${mimeType};base64,${imagePath.imageData}`;
  }
  
  // Handle Image objects with _id (list view - fetched via populate with imageData excluded)
  if (typeof imagePath === 'object' && imagePath._id) {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${backendUrl}/api/images/${imagePath._id}`;
  }
  
  // Handle string IDs directly
  if (typeof imagePath === 'string' && imagePath.match(/^[a-f\d]{24}$/i)) {
    // This is a MongoDB ObjectId
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${backendUrl}/api/images/${imagePath}`;
  }
  
  // Handle other object types that don't have ID or imageData
  if (typeof imagePath === 'object') {
    console.warn('Image object missing imageData or _id:', imagePath);
    return '/images/placeholder.png';
  }
  
  // If it's already a full URL (starts with http/https), return as-is
  if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    return imagePath;
  }
  
  // If it's a local placeholder, return as-is
  if (typeof imagePath === 'string' && imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // If it's a data URL (base64), return as-is
  if (typeof imagePath === 'string' && imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If string is provided but doesn't match any pattern
  if (typeof imagePath === 'string' && imagePath.length > 0) {
    // Get backend URL from environment or use default
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Prepend backend URL to relative paths
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${backendUrl}${normalizedPath}`;
  }
  
  return '/images/placeholder.png';
};

export default getImageUrl;
