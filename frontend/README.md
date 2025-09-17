# Lune Laser Systems - Frontend

This is the React frontend for the Lune Laser Systems Invoice Management application.

## Backend Connection

This frontend is configured to connect to the backend API at:
- **Backend URL**: https://enamel-backend.onrender.com
- **API Endpoints**: https://enamel-backend.onrender.com/api/*

## Fixed Issues

✅ **JSON Parsing Errors Resolved**
- Updated API service to use absolute backend URLs instead of relative URLs
- Fixed CreateOffice, Dashboard, and AddLune components to call correct endpoints
- Configured environment variables for production deployment

## Deployment

This frontend is ready to be deployed on Vercel with the correct environment variables configured.

## Local Development

```bash
npm install
npm start
```

The app will run on http://localhost:3000 and connect to the production backend.
