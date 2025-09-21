#!/usr/bin/env node

/**
 * Deployment script for LearnQuest English AI Tutor
 * This script helps automate the deployment process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 LearnQuest Deployment Script');
console.log('================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if environment variables are set
function checkEnvVars() {
  console.log('🔍 Checking environment variables...');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY'
  ];
  
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables or create a .env.production file.');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

// Build the application
function buildApp() {
  console.log('\n🏗️  Building application...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check build output
function checkBuildOutput() {
  console.log('\n📁 Checking build output...');
  
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build output directory not found');
    process.exit(1);
  }
  
  const indexFile = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error('❌ index.html not found in build output');
    process.exit(1);
  }
  
  console.log('✅ Build output looks good');
}

// Deploy to platform
function deployToPlatform(platform) {
  console.log(`\n🚀 Deploying to ${platform}...`);
  
  switch (platform.toLowerCase()) {
    case 'vercel':
      deployToVercel();
      break;
    case 'netlify':
      deployToNetlify();
      break;
    default:
      console.log(`\n📋 Manual deployment instructions for ${platform}:`);
      console.log('1. Upload the contents of the "dist" folder to your web server');
      console.log('2. Configure your web server to serve index.html for all routes');
      console.log('3. Ensure HTTPS is enabled');
      console.log('4. Update your Supabase configuration with the new domain');
  }
}

function deployToVercel() {
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { stdio: 'pipe' });
    
    console.log('Deploying to Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment to Vercel completed');
  } catch (error) {
    console.error('❌ Vercel deployment failed:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('1. Installed Vercel CLI: npm i -g vercel');
    console.log('2. Logged in: vercel login');
    console.log('3. Set up your project: vercel link');
  }
}

function deployToNetlify() {
  try {
    // Check if Netlify CLI is installed
    execSync('netlify --version', { stdio: 'pipe' });
    
    console.log('Deploying to Netlify...');
    execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
    console.log('✅ Deployment to Netlify completed');
  } catch (error) {
    console.error('❌ Netlify deployment failed:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('1. Installed Netlify CLI: npm i -g netlify-cli');
    console.log('2. Logged in: netlify login');
    console.log('3. Linked your site: netlify link');
  }
}

// Main deployment function
function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'manual';
  
  console.log(`Target platform: ${platform}\n`);
  
  // Check environment variables
  checkEnvVars();
  
  // Build the application
  buildApp();
  
  // Check build output
  checkBuildOutput();
  
  // Deploy
  deployToPlatform(platform);
  
  console.log('\n🎉 Deployment process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test your deployed application');
  console.log('2. Update Supabase with your production URL');
  console.log('3. Share your application with users');
  console.log('4. Monitor usage and gather feedback');
  
  console.log('\n📚 For more information, see DEPLOYMENT_GUIDE.md');
}

// Run the deployment script
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvVars,
  buildApp,
  checkBuildOutput,
  deployToPlatform
};
