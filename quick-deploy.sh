#!/bin/bash

# Quick Deployment Script for LearnQuest English AI Tutor
# This script provides a simple way to deploy your application

echo "🚀 LearnQuest Quick Deployment"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to display menu
show_menu() {
    echo "Select deployment option:"
    echo "1) Deploy to Vercel (Recommended)"
    echo "2) Deploy to Netlify"
    echo "3) Build for manual deployment"
    echo "4) Check deployment readiness"
    echo "5) Exit"
    echo ""
}

# Function to check environment variables
check_env() {
    echo "🔍 Checking environment variables..."
    
    if [ ! -f ".env.production" ]; then
        echo "⚠️  .env.production file not found"
        echo "📋 Please create .env.production with the following variables:"
        echo "   VITE_SUPABASE_URL=your_supabase_url"
        echo "   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
        echo "   VITE_OPENAI_API_KEY=your_openai_api_key"
        echo ""
        echo "💡 You can copy env.production.example and fill in your values"
        return 1
    fi
    
    echo "✅ .env.production file found"
    return 0
}

# Function to build the application
build_app() {
    echo "🏗️  Building application..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Build the application
    npm run build:prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Build completed successfully"
        return 0
    else
        echo "❌ Build failed"
        return 1
    fi
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "🚀 Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Login if needed
    echo "🔐 Checking Vercel authentication..."
    vercel whoami &> /dev/null
    if [ $? -ne 0 ]; then
        echo "Please login to Vercel:"
        vercel login
    fi
    
    # Deploy
    vercel --prod
    
    echo "✅ Deployment to Vercel completed!"
    echo "🌐 Your app is now live!"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🚀 Deploying to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        echo "📦 Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Login if needed
    echo "🔐 Checking Netlify authentication..."
    netlify status &> /dev/null
    if [ $? -ne 0 ]; then
        echo "Please login to Netlify:"
        netlify login
    fi
    
    # Deploy
    netlify deploy --prod --dir=dist
    
    echo "✅ Deployment to Netlify completed!"
    echo "🌐 Your app is now live!"
}

# Function for manual deployment
manual_deploy() {
    echo "📁 Manual deployment setup:"
    echo ""
    echo "1. The built files are in the 'dist' folder"
    echo "2. Upload the contents of 'dist' to your web server"
    echo "3. Configure your server to serve index.html for all routes"
    echo "4. Ensure HTTPS is enabled"
    echo "5. Update your Supabase configuration with your domain"
    echo ""
    echo "📂 Build output location: $(pwd)/dist"
    echo ""
    echo "📋 Files to upload:"
    ls -la dist/
}

# Function to check deployment readiness
check_readiness() {
    echo "🔍 Checking deployment readiness..."
    echo ""
    
    # Check Node.js version
    echo "Node.js version: $(node --version)"
    
    # Check npm version
    echo "npm version: $(npm --version)"
    
    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Dependencies not installed (run npm install)"
    fi
    
    # Check environment variables
    check_env
    
    # Try building
    echo ""
    echo "🧪 Testing build..."
    if build_app; then
        echo "✅ Build test passed"
    else
        echo "❌ Build test failed"
    fi
    
    echo ""
    echo "📋 Deployment readiness summary:"
    echo "- Check environment variables: $(check_env && echo "✅" || echo "❌")"
    echo "- Build test: $([ -d "dist" ] && echo "✅" || echo "❌")"
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            if check_env && build_app; then
                deploy_vercel
            fi
            ;;
        2)
            if check_env && build_app; then
                deploy_netlify
            fi
            ;;
        3)
            if check_env && build_app; then
                manual_deploy
            fi
            ;;
        4)
            check_readiness
            ;;
        5)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-5."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
