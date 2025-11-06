#!/bin/bash

echo "🚀 AgriPredict Pro - Quick Deploy to Railway"
echo "============================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Please login to Railway..."
railway login

echo ""
echo "📁 Initializing Railway project..."
railway init

echo ""
echo "⚙️  Please add these environment variables in Railway dashboard:"
echo ""
echo "Backend Service:"
echo "  PORT=3002"
echo "  OPENAI_API_KEY=your_key"
echo "  SENTINEL_CLIENT_ID=your_id"
echo "  SENTINEL_CLIENT_SECRET=your_secret"
echo "  SENTINEL_INSTANCE_ID=your_instance"
echo ""
echo "Frontend Service:"
echo "  VITE_API_URL=https://your-backend.railway.app"
echo ""
echo "🚀 Deploying..."
railway up

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app will be live at: https://your-app.railway.app"
echo ""
echo "Next steps:"
echo "1. Go to Railway dashboard"
echo "2. Add environment variables"
echo "3. Enable public URLs for both services"
echo "4. Update VITE_API_URL with your backend URL"
echo ""
