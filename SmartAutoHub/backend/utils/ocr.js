/**
 * OCR Utility
 * Extracts text from ID images using Tesseract.js
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Preprocess image to enhance text visibility for better OCR
 * Increases contrast, brightness, and sharpness
 * @param {string} imagePath - Path to original image
 * @returns {Promise<Buffer>} - Preprocessed image buffer
 */
const preprocessImageForOCR = async (imagePath) => {
  try {
    console.log('Drawing and preprocessing image...');
    
    // Load and enhance the image with AGGRESSIVE settings for poor quality IDs
    const enhanced = await sharp(imagePath)
      .grayscale() // Convert to grayscale (best for OCR of documents)
      .normalize() // Normalize levels (increase contrast)
      .modulate({
        brightness: 1.3,  // Increase brightness more aggressively
        saturation: 2.0   // High saturation for better contrast
      })
      .sharpen({ sigma: 2 })  // More aggressive sharpening
      .threshold(150)  // Apply threshold to make text black/white
      .toBuffer();
    
    // Convert buffer to base64 for Tesseract.js compatibility
    const base64Image = enhanced.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    console.log('Image preprocessing complete - enhanced version ready');
    return dataUrl;
  } catch (error) {
    console.error('Image preprocessing failed:', error.message);
    return null; // Return null on failure, will use original image
  }
};

/**
 * @param {string} imagePath - Path to the image file or base64 string
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromImage = async (imagePath) => {
  try {
    console.log('🔤 Starting OCR text extraction...');
    
    // Try preprocessing first for better results
    const preprocessed = await preprocessImageForOCR(imagePath);
    const imageToUse = preprocessed || imagePath;
    
    const result = await Tesseract.recognize(
      imageToUse,
      'eng', // English language
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('✅ OCR extraction complete');
    let extractedText = result.data.text.trim();
    console.log(`📊 Raw extracted text length: ${extractedText.length} characters`);
    console.log(`📄 Raw text sample: ${extractedText.substring(0, 100)}`);
    
    // AGGRESSIVE filtering: Keep ONLY alphanumerics, spaces, and common ID separators
    // This removes all special symbols that indicate OCR garbage
    const cleanedText = extractedText
      .replace(/[^a-zA-Z0-9\s\-\/\.]/g, '') // Remove all special chars except -/.
      .replace(/\s+/g, ' ')  // Collapse multiple spaces
      .trim();
    
    console.log(`📊 Cleaned text length: ${cleanedText.length} characters`);
    console.log(`📄 Cleaned text: ${cleanedText.substring(0, 100)}`);
    
    // Quality check: Count digits vs other characters
    const digitCount = (extractedText.match(/[0-9]/g) || []).length;
    const alphanumericCount = (extractedText.match(/[a-zA-Z0-9]/g) || []).length;
    const alphanumericRatio = extractedText.length > 0 ? alphanumericCount / extractedText.length : 0;
    console.log(`📈 Digit count: ${digitCount} | Alphanumeric ratio: ${(alphanumericRatio * 100).toFixed(1)}%`);
    
    // RED FLAG: Very low alphanumeric content = OCR completely failed
    if (alphanumericRatio < 0.15) {
      console.log('🚨 CRITICAL: OCR extracted <15% alphanumeric - image quality extremely poor');
      throw new Error('IMAGE_QUALITY_TOO_LOW');
    }
    
    if (alphanumericRatio < 0.3) {
      console.log('⚠️  WARNING: OCR extracted <30% alphanumeric - image quality poor');
    }
    
    // Check for continuous digit sequences (ID numbers are usually 6+ digits together)
    const digitSequences = cleanedText.match(/\d{4,}/g) || [];
    const hasLongDigitSequence = digitSequences.length > 0 && digitSequences.some(seq => seq.length >= 6);
    
    console.log(`🔢 Found ${digitSequences.length} digit sequences of 4+ chars: ${digitSequences.join(', ')}`);
    
    if (digitSequences.length === 0 || !hasLongDigitSequence) {
      console.log('🚨 NO CONTINUOUS DIGIT SEQUENCES FOUND - Likely scanning wrong document or poor image');
      // Still return text but mark it as unreliable
    }
    
    // Use cleaned text for verification
    return cleanedText.length > 0 ? cleanedText : extractedText;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Extract text from ID front and back images
 * @param {string} frontImagePath - Path to front image
 * @param {string} backImagePath - Path to back image (optional)
 * @returns {Promise<object>} - Extracted text from both sides
 */
const extractIDText = async (frontImagePath, backImagePath = null) => {
  try {
    const frontText = await extractTextFromImage(frontImagePath);
    
    let backText = '';
    if (backImagePath) {
      backText = await extractTextFromImage(backImagePath);
    }
    
    return {
      frontText: frontText.trim(),
      backText: backText.trim(),
      combinedText: `${frontText} ${backText}`.trim()
    };
  } catch (error) {
    console.error('ID Text Extraction Error:', error);
    throw error;
  }
};

/**
 * Compare entered ID number with extracted text
 * @param {string} enteredID - ID number entered by user
 * @param {string} extractedText - Text extracted from ID image
 * @returns {object} - Verification result
 */
const verifyIDNumber = (enteredID, extractedText) => {
  // Normalize: remove spaces, dashes, periods, underscores
  const normalizeString = (str) => {
    return str.replace(/[\s\-\.\_]/g, '').toUpperCase();
  };
  
  const normalizedEnteredID = normalizeString(enteredID);
  const normalizedExtractedText = normalizeString(extractedText);
  
  // Strategy 1: Exact substring match
  const isExactMatch = normalizedExtractedText.includes(normalizedEnteredID);
  if (isExactMatch) {
    return {
      isMatch: true,
      confidence: 100,
      enteredID: normalizedEnteredID,
      extractedText: normalizedExtractedText.substring(0, 100),
      message: 'ID number verified successfully (exact match)'
    };
  }
  
  // Strategy 2: OCR-friendly matching - handle common OCR character confusion
  // 0→O, O→0, 1→I→L, 5→S, 8→B, etc.
  const ocr_substitutions = {
    '0': '[0O]',
    'O': '[0O]',
    '1': '[1IL]',
    'I': '[1IL]',
    'L': '[1IL]',
    '5': '[5S]',
    'S': '[5S]',
    '8': '[8B]',
    'B': '[8B]'
  };
  
  const buildFuzzyPattern = (str) => {
    let pattern = '';
    for (let char of str) {
      if (ocr_substitutions[char]) {
        pattern += ocr_substitutions[char];
      } else {
        pattern += char;
      }
    }
    return pattern;
  };
  
  const fuzzyPattern = new RegExp(buildFuzzyPattern(normalizedEnteredID));
  const fuzzyMatch = fuzzyPattern.test(normalizedExtractedText);
  
  if (fuzzyMatch) {
    return {
      isMatch: true,
      confidence: 95,
      enteredID: normalizedEnteredID,
      extractedText: normalizedExtractedText.substring(0, 100),
      message: 'ID number verified successfully (fuzzy OCR match)'
    };
  }
  
  // Strategy 3: Longest common substring (handles partial matches)
  const findLongestCommonSubstring = (str1, str2) => {
    let longest = '';
    for (let i = 0; i < str1.length; i++) {
      for (let j = i + 1; j <= str1.length; j++) {
        const substr = str1.substring(i, j);
        if (str2.includes(substr) && substr.length > longest.length) {
          longest = substr;
        }
      }
    }
    return longest;
  };
  
  const commonSubstring = findLongestCommonSubstring(normalizedEnteredID, normalizedExtractedText);
  const substringConfidence = Math.round((commonSubstring.length / normalizedEnteredID.length) * 100);
  
  // Strategy 4: Character-by-character matching
  let charMatchCount = 0;
  for (let char of normalizedEnteredID) {
    if (normalizedExtractedText.includes(char)) {
      charMatchCount++;
    }
  }
  const charMatchConfidence = Math.round((charMatchCount / normalizedEnteredID.length) * 100);
  
  // Use best confidence
  const confidence = Math.max(charMatchConfidence, substringConfidence);
  const isMatch = substringConfidence >= 80; // 80% of ID must be continuous
  
  return {
    isMatch,
    confidence,
    enteredID: normalizedEnteredID,
    extractedText: normalizedExtractedText.substring(0, 100),
    message: isMatch 
      ? 'ID number verified successfully' 
      : `ID verification failed. Confidence: ${confidence}%`
  };
};

/**
 * Extract structured data from ID (name, DOB, etc.)
 * This is a basic implementation - production would use ML models
 */
const parseIDData = (extractedText) => {
  const result = {
    possibleName: null,
    possibleDOB: null,
    possibleIDNumber: null,
    rawText: extractedText
  };
  
  // Simple regex patterns for common ID formats
  // Date pattern (various formats)
  const datePattern = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})|(\d{2,4}[\/-]\d{1,2}[\/-]\d{1,2})/g;
  const dates = extractedText.match(datePattern);
  if (dates && dates.length > 0) {
    result.possibleDOB = dates[0];
  }
  
  // ID number pattern (alphanumeric, typically 8-12 characters)
  const idPattern = /[A-Z0-9]{8,12}/g;
  const possibleIDs = extractedText.match(idPattern);
  if (possibleIDs && possibleIDs.length > 0) {
    result.possibleIDNumber = possibleIDs[0];
  }
  
  return result;
};

module.exports = {
  extractTextFromImage,
  extractIDText,
  verifyIDNumber,
  parseIDData
};
