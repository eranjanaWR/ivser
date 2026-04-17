# Single Port Setup - SmartAuto Hub

## ✅ Configuration Complete

Your application is now configured to run on **a single port (5000)** instead of separate ports for frontend and backend.

---

## 🎯 How It Works

1. **Backend Server** runs on `http://localhost:5000`
2. **Frontend (React)** is built into static files served from backend
3. **API calls** are made to `/api/*` endpoints (same host)
4. **Socket.io** works seamlessly on the same port

---

## 🚀 How to Run

### Option 1: Run Backend Only (Recommended for Development)
```bash
cd SmartAutoHub/backend
npm start
```
Then open: **http://localhost:5000**

The backend will automatically serve the frontend and API together.

---

### Option 2: Rebuild Frontend + Run Backend
If you made changes to the frontend code:
```bash
# Build frontend
cd SmartAutoHub/frontend
npm run build

# Run backend
cd ../backend
npm start
```
Then open: **http://localhost:5000**

---

## 📁 Project Structure

```
backend/
  ├── server.js              # Serves frontend + API
  ├── routes/                # API endpoints
  ├── controllers/
  ├── models/
  └── config/
frontend/
  ├── src/                   # React source code
  ├── build/                 # Compiled static files (served by backend)
  └── package.json
```

---

## 🔧 Backend Configuration

Your `backend/server.js` is already configured to:

1. **Serve static files** from frontend build:
   ```javascript
   const frontendPath = path.join(__dirname, '../frontend/build');
   app.use(express.static(frontendPath));
   ```

2. **Handle API routes** first:
   ```javascript
   app.use('/api/auth', authRoutes);
   app.use('/api/users', userRoutes);
   // ... other routes
   ```

3. **Fallback to React Router** for other URLs:
   ```javascript
   app.get('*', (req, res) => {
     res.sendFile(path.join(frontendPath, 'index.html'));
   });
   ```

---

## 📝 Frontend API Configuration

Your `frontend/src/services/api.js` uses **relative URLs**:
```javascript
const api = axios.create({
  baseURL: '/api',  // ✅ Correct! Uses same host
  headers: {
    'Content-Type': 'application/json',
  },
});
```

This means API calls automatically go to `localhost:5000/api/*` ✅

---

## ✅ Current Status

| Component | Port | Status |
|-----------|------|--------|
| Frontend  | 5000 | ✅ Serving from backend |
| Backend   | 5000 | ✅ Running |
| API       | 5000 | ✅ Accessible at `/api/*` |
| Socket.io | 5000 | ✅ Ready |
| MongoDB   | Cloud | ✅ Connected |

---

## 🔗 Access Points

- **Web App**: http://localhost:5000/
- **API Health**: http://localhost:5000/api/health
- **Login Page**: http://localhost:5000/login

---

## 🛠️ Development Workflow

### For Backend Changes:
1. Edit backend files
2. Restart `npm start` in backend folder
3. Refresh browser

### For Frontend Changes:
1. Edit React files in `frontend/src/`
2. Run `npm run build` in frontend folder
3. Backend will serve the new files automatically
4. Refresh browser

### For Development (with Hot Reload):
You can run frontend dev server separately while backend serves API:
```bash
# Terminal 1: Backend on port 5000
cd backend && npm start

# Terminal 2: Frontend dev server on port 3000 (for hot reload)
cd frontend && npm start
```

Then frontend on port 3000 calls backend on port 5000. The `.env` already has CORS configured for this.

---

## 🔐 Environment Setup

Your `.env` file is properly configured:
```
MONGODB_URI=mongodb://...      # ✅ Connected
FRONTEND_URL=http://localhost:3000  # For CORS (optional)
JWT_SECRET=...                 # ✅ Configured
EMAIL_USER=...                 # ✅ Configured
```

---

## ✨ Benefits of Single Port

✅ No CORS issues
✅ No port conflicts
✅ Easier deployment to production
✅ Similar to production setup
✅ API calls work consistently
✅ Shared WebSocket connection

---

## 🎓 Login Credentials

**Email**: `gamagesiriwardana2004@gmail.com`
**Password**: `Password123`

---

## 📞 Troubleshooting

### Port 5000 already in use?
```powershell
# Kill the process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend not loading?
1. Verify build exists: `ls backend/../frontend/build/index.html`
2. Rebuild: `cd frontend && npm run build`
3. Restart backend

### API calls return 404?
1. Check that API routes are defined in backend
2. Verify token is being sent correctly
3. Check browser console for exact error

---

**Setup Date**: April 17, 2026
**Status**: ✅ Ready for Development & Deployment
