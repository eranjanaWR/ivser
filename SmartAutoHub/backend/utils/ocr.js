/**
 * OCR Utility
 * Extracts text from ID images using Tesseract.js
 */

const Tesseract = require('tesseract.js');
const path = require('path');

/**
 * Extract text from an image file
 * @param {string} imagePath - Path to the image file or base64 string
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromImage = async (imagePath) => {
  try {
    console.log('Starting OCR text extraction...');
    
    const result = await Tesseract.recognize(
      imagePath,
      'eng', // English language
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('OCR extraction complete');
    return result.data.text;
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
  // Normalize both strings - remove spaces, special characters
  const normalizeString = (str) => {
    return str.replace(/[\s\-\.]/g, '').toUpperCase();
  };
  
  const normalizedEnteredID = normalizeString(enteredID);
  const normalizedExtractedText = normalizeString(extractedText);
  
  // Check if the entered ID appears in the extracted text
  const isMatch = normalizedExtractedText.includes(normalizedEnteredID);
  
  // Calculate confidence based on partial matches
  let confidence = 0;
  if (isMatch) {
    confidence = 100;
  } else {
    // Check for partial match (at least 70% of characters match)
    let matchCount = 0;
    for (let char of normalizedEnteredID) {
      if (normalizedExtractedText.includes(char)) {
        matchCount++;
      }
    }
    confidence = Math.round((matchCount / normalizedEnteredID.length) * 100);
  }
  
  return {
    isMatch,
    confidence,
    enteredID: normalizedEnteredID,
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
