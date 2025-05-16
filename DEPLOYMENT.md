# Deployment Guide

This guide explains how to deploy the Invoice Generator application to various hosting platforms.

## Build Instructions

Before deploying, build the application:

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

The built files will be in the `dist` directory.

## Deployment Options

### 1. Netlify (Recommended)

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Configure environment variables if needed
5. Deploy!

Netlify will automatically handle:

- HTTPS certificates
- CDN distribution
- Continuous deployment
- Asset optimization
- Header configurations (from \_headers file)

### 2. Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

Or deploy through the Vercel dashboard:

1. Import your GitHub repository
2. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. GitHub Pages

1. Update vite.config.js base property to match your repository name:

```js
base: '/your-repo-name/';
```

2. Create .github/workflows/deploy.yml for automated deployment
3. Enable GitHub Pages in repository settings
4. Set the branch to gh-pages and folder to / (root)

### 4. Traditional Web Server (Apache/Nginx)

#### Apache Configuration

1. Copy the contents of `dist` to your web root
2. Create .htaccess file:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Enable Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>
```

#### Nginx Configuration

1. Copy the contents of `dist` to your web root
2. Configure your Nginx server block:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # Enable Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
    gzip_disable "MSIE [1-6]\.";

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # SPA configuration
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob:; font-src 'self' https://cdnjs.cloudflare.com; object-src 'none'";
}
```

## Post-Deployment Checklist

1. Verify all pages load correctly
2. Test invoice creation and PDF generation
3. Check PWA installation
4. Validate offline functionality
5. Test responsive design on multiple devices
6. Verify SSL/HTTPS is working
7. Run Lighthouse audit
8. Submit sitemap.xml to search engines
9. Monitor error reporting
10. Set up uptime monitoring

## Performance Monitoring

Consider setting up:

- Google Analytics for user tracking
- LogRocket for session replay
- Sentry for error tracking

## Support

For deployment issues:

1. Check the console for errors
2. Verify build output
3. Check server logs
4. Review environment variables
5. Contact support@invoice-generator.com
