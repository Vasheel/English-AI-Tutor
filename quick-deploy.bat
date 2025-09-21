@echo off
setlocal enabledelayedexpansion

echo 🚀 LearnQuest Quick Deployment
echo ==============================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

:MENU
echo Select deployment option:
echo 1) Deploy to Vercel (Recommended)
echo 2) Deploy to Netlify
echo 3) Build for manual deployment
echo 4) Check deployment readiness
echo 5) Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto DEPLOY_VERCEL
if "%choice%"=="2" goto DEPLOY_NETLIFY
if "%choice%"=="3" goto MANUAL_DEPLOY
if "%choice%"=="4" goto CHECK_READINESS
if "%choice%"=="5" goto EXIT

echo ❌ Invalid option. Please choose 1-5.
echo.
pause
goto MENU

:DEPLOY_VERCEL
call :CHECK_ENV
if errorlevel 1 goto MENU
call :BUILD_APP
if errorlevel 1 goto MENU

echo 🚀 Deploying to Vercel...
echo 📦 Checking Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo Please login to Vercel:
    vercel login
)

vercel --prod
echo ✅ Deployment to Vercel completed!
echo 🌐 Your app is now live!
goto END

:DEPLOY_NETLIFY
call :CHECK_ENV
if errorlevel 1 goto MENU
call :BUILD_APP
if errorlevel 1 goto MENU

echo 🚀 Deploying to Netlify...
echo 📦 Checking Netlify CLI...
netlify --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Netlify CLI...
    npm install -g netlify-cli
)

echo 🔐 Checking Netlify authentication...
netlify status >nul 2>&1
if errorlevel 1 (
    echo Please login to Netlify:
    netlify login
)

netlify deploy --prod --dir=dist
echo ✅ Deployment to Netlify completed!
echo 🌐 Your app is now live!
goto END

:MANUAL_DEPLOY
call :CHECK_ENV
if errorlevel 1 goto MENU
call :BUILD_APP
if errorlevel 1 goto MENU

echo 📁 Manual deployment setup:
echo.
echo 1. The built files are in the 'dist' folder
echo 2. Upload the contents of 'dist' to your web server
echo 3. Configure your server to serve index.html for all routes
echo 4. Ensure HTTPS is enabled
echo 5. Update your Supabase configuration with your domain
echo.
echo 📂 Build output location: %CD%\dist
echo.
echo 📋 Files to upload:
dir dist
goto END

:CHECK_READINESS
echo 🔍 Checking deployment readiness...
echo.

echo Node.js version:
node --version
echo npm version:
npm --version

if exist "node_modules" (
    echo ✅ Dependencies installed
) else (
    echo ❌ Dependencies not installed (run npm install)
)

call :CHECK_ENV
echo.
echo 🧪 Testing build...
call :BUILD_APP
if errorlevel 1 (
    echo ❌ Build test failed
) else (
    echo ✅ Build test passed
)

echo.
echo 📋 Deployment readiness summary:
if exist ".env.production" (
    echo - Environment variables: ✅
) else (
    echo - Environment variables: ❌
)

if exist "dist" (
    echo - Build test: ✅
) else (
    echo - Build test: ❌
)
goto END

:CHECK_ENV
echo 🔍 Checking environment variables...

if not exist ".env.production" (
    echo ⚠️  .env.production file not found
    echo 📋 Please create .env.production with the following variables:
    echo    VITE_SUPABASE_URL=your_supabase_url
    echo    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    echo    VITE_OPENAI_API_KEY=your_openai_api_key
    echo.
    echo 💡 You can copy env.production.example and fill in your values
    exit /b 1
)

echo ✅ .env.production file found
exit /b 0

:BUILD_APP
echo 🏗️  Building application...

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

npm run build:prod
if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Build completed successfully
exit /b 0

:END
echo.
pause
goto MENU

:EXIT
echo 👋 Goodbye!
exit /b 0
