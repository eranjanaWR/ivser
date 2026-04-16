# Backend Implementation Checklist

## Quick Setup for Enhanced Vehicle Form

Follow these steps to make your backend support all the new vehicle form fields:

---

## ✅ Step 1: Update Vehicle Model Schema

**File**: `backend/models/Vehicle.js` or `backend/models/AuctionVehicle.js`

### Current fields to Update/Add:

```javascript
// KEEP existing fields, ADD these new ones:

// 👉 NEW: Features array
features: {
  type: [String],
  default: []
}

// 👉 NEW: Asking Price (alongside startingPrice)
askingPrice: {
  type: Number,
  required: true,
  min: 0
}

// 👉 UPDATE: Location object with coordinates
location: {
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'Sri Lanka' },
  latitude: { type: Number, min: -90, max: 90, default: null },  // 👈 NEW
  longitude: { type: Number, min: -180, max: 180, default: null } // 👈 NEW
}

// 👉 NEW: Main cover image tracking
mainCoverImageIndex: {
  type: Number,
  default: 0
}

// Update images structure (if not already):
images: [{
  url: String,
  isMainCover: Boolean
}]
```

**✅ Checklist Item:**
- [ ] Model updated with all 4 new fields above

---

## ✅ Step 2: Update Vehicle Creation Handler

**File**: `backend/controllers/vehicleController.js` or your vehicle route handler

### Required Changes:

1. **Extract the new fields from request:**
```javascript
const { features, askingPrice, location, mainCoverImageIndex } = req.body;
```

2. **Parse JSON fields (they come as strings from FormData):**
```javascript
// Features comes as JSON string, parse it
const parsedFeatures = typeof features === 'string' 
  ? JSON.parse(features) 
  : features || [];

// Location comes as JSON string, parse it
const parsedLocation = typeof location === 'string' 
  ? JSON.parse(location) 
  : location || {};
```

3. **Validate new fields:**
```javascript
// Validate asking price > starting price
if (parseFloat(askingPrice) < parseFloat(startingPrice)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Asking Price must be >= Starting Price' 
  });
}

// Validate location fields
if (!parsedLocation.city || !parsedLocation.state) {
  return res.status(400).json({ 
    success: false, 
    message: 'City and State are required' 
  });
}

// Validate coordinates if provided
if (parsedLocation.latitude) {
  const lat = parseFloat(parsedLocation.latitude);
  if (lat < -90 || lat > 90) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid latitude' 
    });
  }
}
```

4. **Build vehicle object with new fields:**
```javascript
const vehicle = new Vehicle({
  // ... existing fields ...
  features: parsedFeatures,
  askingPrice: parseFloat(askingPrice),
  location: {
    city: parsedLocation.city?.trim(),
    state: parsedLocation.state?.trim(),
    country: parsedLocation.country || 'Sri Lanka',
    latitude: parsedLocation.latitude ? parseFloat(parsedLocation.latitude) : null,
    longitude: parsedLocation.longitude ? parseFloat(parsedLocation.longitude) : null
  },
  mainCoverImageIndex: parseInt(mainCoverImageIndex) || 0,
  // ... rest of fields ...
});
```

5. **Add logging for debugging:**
```javascript
console.log('✅ Vehicle created:');
console.log(`   Features: ${vehicle.features.join(', ') || 'None'}`);
console.log(`   Asking Price: LKR ${vehicle.askingPrice}`);
console.log(`   Location: ${vehicle.location.city}, ${vehicle.location.state}`);
console.log(`   Coordinates: ${vehicle.location.latitude}, ${vehicle.location.longitude}`);
```

**✅ Checklist Item:**
- [ ] POST handler updated to parse and validate all new fields
- [ ] Logging added for debugging

---

## ✅ Step 3: Ensure Image Upload Middleware

**File**: Your route configuration (e.g., `backend/routes/vehicle.js` or `backend/server.js`)

### Required:

```javascript
const multer = require('multer');

// Configure multer BEFORE the route handler:
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/vehicles'); // Adjust path as needed
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.random().toString(36).substring(7);
      cb(null, uniqueName + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format'));
    }
  }
});

// Register route with upload middleware:
router.post(
  '/auction-vehicles',
  authenticate,  // Your auth middleware
  upload.array('images', 20), // Accept up to 20 images
  vehicleCreateHandler
);
```

**✅ Checklist Item:**
- [ ] Multer configured to accept up to 20 images
- [ ] Image path configured correctly
- [ ] Route handler uses upload middleware

---

## ✅ Step 4: Update Image Processing

In your vehicle creation handler, process images:

```javascript
const processedImages = [];

if (req.files && req.files.length > 0) {
  req.files.forEach((file, index) => {
    processedImages.push({
      url: `/uploads/vehicles/${file.filename}`, // Adjust path
      isMainCover: parseInt(mainCoverImageIndex) === index
    });
  });
}

// Add to vehicle:
vehicle.images = processedImages;
```

**✅ Checklist Item:**
- [ ] Images properly transformed with isMainCover flag
- [ ] Main cover index correctly matched

---

## ✅ Step 5: Update GET Endpoint (Retrieve Vehicle)

**File**: GET vehicle handler

Add this to include calculated fields:

```javascript
const vehicle = await Vehicle.findById(id);

// Calculate auction status
const now = new Date();
const timeRemaining = vehicle.auctionEndDate - now;
const isLive = now >= vehicle.auctionStartDate && now <= vehicle.auctionEndDate;

// Return with metadata
res.json({
  success: true,
  data: {
    ...vehicle.toObject(),
    timeRemainingMs: timeRemaining,
    isAuctionActive: isLive,
    // Features already included as array
    // Location already included with coordinates
    // Images already included with main cover flag
  }
});
```

**✅ Checklist Item:**
- [ ] GET endpoint enhanced with auction status metadata

---

## ✅ Step 6: Create uploads Directory

Run these commands in your backend folder:

```bash
# Create uploads directory structure
mkdir -p uploads/vehicles
mkdir -p uploads/profiles
mkdir -p uploads/ids
mkdir -p uploads/selfies
mkdir -p uploads/breakdowns
mkdir -p uploads/bank_slips
```

Or use Node.js to create them automatically:

```javascript
// backend/server.js or startup script
const fs = require('fs');

const uploadDirs = [
  'uploads/vehicles',
  'uploads/profiles',
  'uploads/ids'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
```

**✅ Checklist Item:**
- [ ] `uploads/vehicles` directory exists and is writable

---

## ✅ Step 7: Environment Variables (Optional)

If using cloud storage (AWS S3, Firebase, etc.):

```bash
# .env file
VEHICLE_IMAGE_UPLOAD_PATH=/uploads/vehicles
MAX_IMAGE_SIZE=10485760  # 10MB in bytes
MAX_IMAGES_PER_VEHICLE=20
```

**✅ Checklist Item:**
- [ ] Storage path configured

---

## ✅ Step 8: Testing the Implementation

### Test with cURL/Postman:

```bash
curl -X POST http://localhost:5000/api/auction-vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "brand=Toyota" \
  -F "model=Camry" \
  -F "year=2022" \
  -F "mileage=25000" \
  -F "fuelType=petrol" \
  -F "transmission=automatic" \
  -F "condition=excellent" \
  -F "engineCapacity=2.0L" \
  -F "color=Silver" \
  -F "doors=4" \
  -F "seats=5" \
  -F "bodyType=sedan" \
  -F "features=[\"Air Conditioning\",\"ABS\",\"Sunroof\"]" \
  -F "startingPrice=2500000" \
  -F "askingPrice=3200000" \
  -F "auctionStartDate=2026-04-20T10:00" \
  -F "auctionEndDate=2026-04-25T18:00" \
  -F "location={\"city\":\"Colombo\",\"state\":\"Western\",\"latitude\":6.9271,\"longitude\":80.7855}" \
  -F "description=Excellent condition vehicle" \
  -F "mainCoverImageIndex=0" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

**✅ Checklist Item:**
- [ ] POST endpoint tested and works with new fields
- [ ] Response includes all stored data

---

## ✅ Step 9: Test from Frontend

1. Start your backend: `npm start` (port 5000)
2. Start your frontend: `npm start` (port 3000)
3. Click "Add Vehicle" button
4. Fill all form sections
5. Click "Add for Bidding"
6. Check:
   - No error messages appear ✓
   - Loading spinner shows briefly ✓
   - Backend logs show vehicle created ✓
   - Modal closes after success ✓
   - Vehicle appears in dashboard/list ✓

**✅ Checklist Item:**
- [ ] End-to-end flow tested successfully
- [ ] No console errors on frontend or backend

---

## ✅ Step 10: Database Migration (If Existing Data)

If you have existing vehicles, run:

```javascript
// backend/scripts/migrateVehicles.js

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

async function migrate() {
  try {
    const result = await Vehicle.updateMany(
      { features: { $exists: false } }, // Update only if field missing
      {
        $set: {
          features: [],
          askingPrice: '$startingPrice', // Use aggregation or iterate
          mainCoverImageIndex: 0,
          'location.latitude': null,
          'location.longitude': null
        }
      }
    );
    
    console.log(`✅ Migrated ${result.modifiedCount} vehicles`);
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
```

Run with:
```bash
node backend/scripts/migrateVehicles.js
```

**✅ Checklist Item:**
- [ ] Migration script created and tested (if needed)

---

## ✅ Final Verification

After all steps, verify:

```javascript
// Query a vehicle and check response
const vehicle = await Vehicle.findOne();
console.log({
  features: vehicle.features,           // Should be array
  askingPrice: vehicle.askingPrice,     // Should be number
  mainCoverIndex: vehicle.mainCoverImageIndex, // Should be number
  coordinates: {
    lat: vehicle.location.latitude,     // Should be number or null
    lng: vehicle.location.longitude     // Should be number or null
  },
  imageCount: vehicle.images.length     // Should be > 0
});
```

**Expected Output:**
```javascript
{
  features: ['Air Conditioning', 'ABS', 'Sunroof'],
  askingPrice: 3200000,
  mainCoverIndex: 0,
  coordinates: { lat: 6.9271, lng: 80.7855 },
  imageCount: 3
}
```

---

## ❌ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid JSON" error | Features/location not parsed | Add `JSON.parse()` in handler |
| Images not uploading | Multer not configured | Add `upload.array('images', 20)` |
| Coordinates not saved | Not handling null values | Add null check before storing |
| Images missing | Path incorrect | Verify `uploads/vehicles` exists |
| Form validation fails | handleChange not updated | Check that `handleFeatureChange` works |
| Features showing as object | Not stringifying when sending | Verify `JSON.stringify()` in FormData |

---

## 📊 Success Criteria

✅ You're done when:

- [x] Model has all 4 new fields
- [x] POST handler parses features (JSON)
- [x] POST handler parses location (JSON)
- [x] Images upload to `uploads/vehicles`
- [x] Multer configuration supports 20 images
- [x] Main cover image flag set correctly
- [x] GET endpoint returns all fields
- [x] Form submit works without errors
- [x] Data persists in MongoDB
- [x] Features appear as array, not string
- [x] Coordinates stored with correct ranges
- [x] Backend logging shows all values

---

**Estimated Time**: 30-45 minutes

**Difficulty**: Medium

Need help? Check the detailed `FORM_BACKEND_GUIDE.md` for code samples!
