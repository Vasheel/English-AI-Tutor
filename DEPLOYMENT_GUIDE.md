# 🚀 Deployment Guide - LearnQuest English AI Tutor

This guide will help you deploy your English AI Tutor website to make it accessible to anyone on the internet.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase Project** - Database and authentication
2. **OpenAI API Key** - For AI features
3. **GitHub Account** - For code hosting
4. **Deployment Platform Account** - Vercel, Netlify, or other

## 🔧 Environment Setup

### 1. Configure Environment Variables

Create a `.env.production` file with your production values:

```bash
# Copy the example file
cp env.production.example .env.production
```

Edit `.env.production` with your actual values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_APP_ENV=production
VITE_APP_URL=https://your-domain.com
```

### 2. Update Supabase Configuration

In your Supabase dashboard:

1. Go to **Authentication > URL Configuration**
2. Add your production domain to **Site URL**
3. Add your domain to **Redirect URLs**:
   - `https://your-domain.com/auth`
   - `https://your-domain.com/auth/callback`

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

#### Quick Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY`
5. Click **"Deploy"**

#### Custom Domain on Vercel

1. In your Vercel dashboard, go to **Domains**
2. Add your custom domain
3. Update DNS settings as instructed
4. SSL will be automatically configured

### Option 2: Netlify

#### Deploy via Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click **"New site from Git"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables in **Site settings > Environment variables**
6. Click **"Deploy site"**

#### Netlify CLI Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: GitHub Pages

1. Go to your repository **Settings > Pages**
2. Select **GitHub Actions** as source
3. The workflow will automatically deploy on push to main branch

### Option 4: Traditional Hosting (cPanel, etc.)

1. Build the application:

   ```bash
   npm run build
   ```

2. Upload the `dist` folder contents to your web server

3. Configure your web server to serve `index.html` for all routes

## 🔄 Automated Deployment

### GitHub Actions Setup

The repository includes automated deployment workflows:

1. **Push to main branch** → Automatic deployment
2. **Pull requests** → Preview deployments

### Required Secrets

Add these secrets to your GitHub repository:

**For Vercel:**

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**For Netlify:**

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

**Environment Variables:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY`

## 🛠️ Build Optimization

### Production Build

```bash
# Install dependencies
npm install

# Create production build
npm run build

# Preview the build locally
npm run preview
```

### Build Configuration

The `vite.config.ts` is already optimized for production with:

- Code splitting
- Asset optimization
- Tree shaking
- Minification

## 📱 Mobile Optimization

Your app is already mobile-optimized with:

- ✅ Responsive design
- ✅ Touch-friendly interactions
- ✅ PWA capabilities
- ✅ Mobile navigation
- ✅ Optimized performance

## 🔒 Security Considerations

### Environment Variables

- Never commit `.env.production` to version control
- Use platform-specific secret management
- Rotate API keys regularly

### HTTPS

- All modern hosting platforms provide HTTPS by default
- Ensure your custom domain uses SSL certificates

### Supabase Security

- Configure Row Level Security (RLS) policies
- Limit API key permissions
- Monitor usage and set rate limits

## 🧪 Testing Your Deployment

### Pre-deployment Testing

```bash
# Test the production build locally
npm run build
npm run preview
```

### Post-deployment Testing

1. **Functionality Tests:**

   - User registration/login
   - Password reset
   - All interactive features
   - Mobile responsiveness

2. **Performance Tests:**

   - Page load times
   - Mobile performance
   - Network requests

3. **Security Tests:**
   - HTTPS enforcement
   - Environment variables not exposed
   - Authentication flow

## 📊 Monitoring and Analytics

### Add Google Analytics (Optional)

1. Get your Google Analytics ID
2. Add to environment variables:
   ```env
   VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
   ```

### Error Monitoring

Consider adding error monitoring services:

- Sentry
- LogRocket
- Bugsnag

## 🔄 Updates and Maintenance

### Automatic Updates

- GitHub Actions handle automatic deployments
- Updates deploy when you push to main branch

### Manual Updates

```bash
# Make your changes
git add .
git commit -m "Update feature"
git push origin main
```

### Rollback

Most platforms allow easy rollback to previous deployments:

- Vercel: Dashboard → Deployments → Rollback
- Netlify: Dashboard → Deploys → Restore

## 🆘 Troubleshooting

### Common Issues

**Build Failures:**

- Check environment variables
- Verify all dependencies are installed
- Review build logs

**Authentication Issues:**

- Verify Supabase URL configuration
- Check redirect URLs in Supabase
- Ensure HTTPS is used in production

**Mobile Issues:**

- Test on actual devices
- Check viewport configuration
- Verify touch interactions

### Getting Help

1. Check platform-specific documentation
2. Review build logs
3. Test locally first
4. Contact platform support if needed

## 🎉 You're Live!

Once deployed, your English AI Tutor will be accessible to anyone with the URL. Share it with students, teachers, and parents to start learning!

### Next Steps

1. **Share your URL** with potential users
2. **Monitor usage** and gather feedback
3. **Iterate and improve** based on user needs
4. **Scale up** as your user base grows

---

**Happy Learning! 🎓✨**
