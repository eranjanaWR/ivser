# SmartAuto Hub

A comprehensive MERN stack vehicle marketplace application for buying, selling, and repairing vehicles.

## Features

### User Roles
- **Buyer**: Browse vehicles, request test drives, request breakdown assistance
- **Seller**: List vehicles, manage listings, respond to test drive requests
- **Repairman**: Accept breakdown requests, live location tracking
- **Admin1**: Full admin dashboard with user management and reports
- **Admin2**: User verification management (ID and face verification)

### Core Features
- **Vehicle Marketplace**: Browse, filter, and search vehicle listings
- **Test Drive Scheduling**: Request and manage test drive appointments
- **Price Prediction**: AI-powered vehicle price estimation
- **Emergency Breakdown**: Real-time breakdown assistance with live location tracking
- **Multi-step Verification**: Email OTP, ID document upload, Face verification

### Security
- JWT authentication
- Role-based access control
- ID verification with Tesseract.js OCR
- Face verification with face-api.js
- Email OTP verification

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.io for real-time features
- JWT for authentication
- Multer for file uploads
- Tesseract.js for OCR
- face-api.js for face verification
- Nodemailer for email

### Frontend
- React 18
- Material-UI 5
- React Router 6
- Axios for API calls
- Socket.io-client
- @react-google-maps/api

## Project Structure

```
SmartAutoHub/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── testDriveController.js
│   │   ├── breakdownController.js
│   │   ├── adminController.js
│   │   └── predictionController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── TestDrive.js
│   │   └── Breakdown.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── vehicle.js
│   │   ├── testDrive.js
│   │   ├── breakdown.js
│   │   ├── admin.js
│   │   └── prediction.js
│   ├── utils/
│   │   ├── email.js
│   │   ├── ocr.js
│   │   ├── faceVerification.js
│   │   └── helpers.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.js
│   │   │       ├── Footer.js
│   │   │       └── PrivateRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── SignupPage.js
│   │   │   ├── VerificationPage.js
│   │   │   ├── VehiclesPage.js
│   │   │   ├── VehicleDetailPage.js
│   │   │   ├── AddVehiclePage.js
│   │   │   ├── MyVehiclesPage.js
│   │   │   ├── TestDrivesPage.js
│   │   │   ├── BreakdownPage.js
│   │   │   ├── RepairmanMapPage.js
│   │   │   ├── PredictionPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── Admin1Dashboard.js
│   │   │   ├── Admin2Dashboard.js
│   │   │   └── NotFoundPage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account or local MongoDB
- Google Maps API key (for maps features)
- Gmail account or SendGrid API key (for email)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google Maps
GOOGLE_MAPS_API_KEY=your-api-key
```

5. Download face-api.js models (for face verification):
```bash
mkdir -p public/models
# Download models from https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

6. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your-api-key
```

4. Start the development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send email OTP
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/verify-id` - Upload ID document
- `POST /api/auth/verify-face` - Upload selfie for face verification

### Vehicles
- `GET /api/vehicles` - Get all vehicles (with filters)
- `GET /api/vehicles/:id` - Get single vehicle
- `POST /api/vehicles` - Create vehicle (seller only)
- `PUT /api/vehicles/:id` - Update vehicle (owner only)
- `DELETE /api/vehicles/:id` - Delete vehicle (owner only)

### Test Drives
- `GET /api/test-drives` - Get test drives
- `POST /api/test-drives` - Request test drive
- `PATCH /api/test-drives/:id` - Update test drive status

### Breakdowns
- `POST /api/breakdowns` - Create breakdown request
- `GET /api/breakdowns/nearby` - Get nearby breakdowns (repairman)
- `PATCH /api/breakdowns/:id/accept` - Accept breakdown (repairman)
- `PATCH /api/breakdowns/:id/complete` - Complete breakdown

### Admin
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/pending-verifications` - Get pending verifications
- `POST /api/admin/verify-user/:id` - Approve/reject verification

## UI Design

The application follows a professional, minimal design similar to Uber:
- Clean white background
- Gray and black text
- Blue accent color (#1976d2)
- No fancy colors or gradients
- Simple, intuitive layout

## License

MIT License
