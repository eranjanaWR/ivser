/**
 * Watermark utility for adding "takgaala.lk" watermark to vehicle images
 */

export const applyWatermarkToImage = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Add semi-transparent overlay for watermark background
        const fontSize = Math.max(img.width / 15, 30);
        const padding = fontSize / 2;
        
        // Set up text styling
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text metrics
        const textMetrics = ctx.measureText('takgaala.lk');
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        
        // Position watermark at center of image
        const x = img.width / 2;
        const y = img.height / 2;
        
        // Draw watermark text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('takgaala.lk', x, y);
        
        // Add shadow effect to text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillText('takgaala.lk', x + 2, y + 2);
        
        // Convert canvas to data URL
        const watermarkedImageUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(watermarkedImageUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for watermarking'));
    };
    
    img.src = imageSrc;
  });
};

/**
 * Cache for watermarked images to avoid re-processing
 */
const watermarkCache = new Map();

export const getWatermarkedImage = async (imageSrc) => {
  // Return cached version if available
  if (watermarkCache.has(imageSrc)) {
    return watermarkCache.get(imageSrc);
  }
  
  try {
    const watermarkedUrl = await applyWatermarkToImage(imageSrc);
    watermarkCache.set(imageSrc, watermarkedUrl);
    return watermarkedUrl;
  } catch (error) {
    console.error('Error applying watermark:', error);
    // Return original image if watermarking fails
    return imageSrc;
  }
};

/**
 * Clear watermark cache if needed
 */
export const clearWatermarkCache = () => {
  watermarkCache.clear();
};
