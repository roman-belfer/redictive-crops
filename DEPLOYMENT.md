# 🚀 AgriPredict Pro - Deployment Guide

## Free Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

#### A. Deploy Backend to Render.com (Free)

1. **Create account at [Render.com](https://render.com)**

2. **Create New Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Name**: `agripredict-backend`
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node src/index.js`
     - **Plan**: Free

3. **Add Environment Variables** in Render Dashboard:
   ```
   PORT=3002
   OPENAI_API_KEY=your_openai_api_key
   SENTINEL_CLIENT_ID=your_sentinel_client_id
   SENTINEL_CLIENT_SECRET=your_sentinel_client_secret
   SENTINEL_INSTANCE_ID=your_sentinel_instance_id
   ```

4. **Note your backend URL**: `https://agripredict-backend.onrender.com`

#### B. Deploy Frontend to Vercel (Free)

1. **Update API URL in client**
   - Edit `client/vite.config.js`:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api': {
           target: 'https://agripredict-backend.onrender.com', // Your Render URL
           changeOrigin: true,
         }
       }
     }
   })
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy Frontend**
   ```bash
   cd client
   npm run build
   vercel --prod
   ```

4. **Configure Vercel**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

---

### Option 2: Railway (Full-Stack - Easiest)

1. **Create account at [Railway.app](https://railway.app)**

2. **New Project → Deploy from GitHub**

3. **Add Two Services:**

   **Service 1: Backend**
   - Root Directory: `server`
   - Start Command: `npm install && node src/index.js`
   - Environment Variables:
     ```
     PORT=3002
     OPENAI_API_KEY=your_key
     SENTINEL_CLIENT_ID=your_id
     SENTINEL_CLIENT_SECRET=your_secret
     SENTINEL_INSTANCE_ID=your_instance
     ```
   - Public URL: Enable

   **Service 2: Frontend**
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
   - Environment Variables:
     ```
     VITE_API_URL=https://your-backend.railway.app
     ```
   - Public URL: Enable

---

### Option 3: Render (Full-Stack)

Deploy both services on Render:

1. **Backend Service** (as above)

2. **Frontend Static Site**
   - Type: Static Site
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`
   - Add Rewrites:
     - Source: `/api/*`
     - Destination: `https://your-backend.onrender.com/api/*`

---

## Environment Variables You'll Need

### Backend (.env)
```bash
PORT=3002
OPENAI_API_KEY=sk-...
SENTINEL_CLIENT_ID=c7560736-bb07-482d-a850-314956d4b231
SENTINEL_CLIENT_SECRET=your_secret
SENTINEL_INSTANCE_ID=a4009b6e-1a87-4000-9eb1-e6823de8255d
```

### Frontend (if needed)
```bash
VITE_API_URL=https://your-backend-url.com
```

---

## Pre-Deployment Checklist

- [ ] Push code to GitHub
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Test build locally: `npm run build` in client folder
- [ ] Verify all API keys are ready
- [ ] Update CORS settings in backend if needed

---

## Update Backend CORS for Production

Edit `server/src/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app',
    'https://your-frontend.railway.app'
  ]
}));
```

---

## Quick Deploy Commands

### Railway (Recommended for beginners)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Vercel (Frontend only)
```bash
cd client
npm run build
vercel --prod
```

---

## Post-Deployment

1. ✅ Test the live URL
2. ✅ Verify NDVI layer loads
3. ✅ Test demo data functionality
4. ✅ Check financial analysis works
5. ✅ Monitor logs for errors

---

## Free Tier Limitations

| Platform | Limitation |
|----------|------------|
| Render   | Sleeps after 15 min inactivity, 750 hrs/month |
| Vercel   | 100 GB bandwidth/month |
| Railway  | $5 credit/month (~500 hrs) |

---

## Support

If you encounter issues:
1. Check build logs in deployment platform
2. Verify environment variables
3. Test API endpoints manually
4. Check CORS configuration

**Your app will be live at:**
- Frontend: `https://your-app.vercel.app` or `https://your-app.railway.app`
- Backend: `https://your-api.onrender.com` or `https://your-api.railway.app`

🎉 Happy farming! 🌾
