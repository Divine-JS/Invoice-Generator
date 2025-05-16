# Invoice Generator

A professional, web-based invoice generator application that allows users to create, manage, and export invoices as PDFs. Built with modern web technologies and optimized for performance.

## Features

- 📄 Create professional invoices with customizable templates
- 💾 Export invoices as PDF documents
- 📱 Responsive design for all devices
- 🔄 Automatic invoice numbering
- 💼 Client management
- 📊 Dashboard with invoice statistics
- 📝 Invoice history and management
- 🎨 Customizable styling options

## Live Demo

Visit [https://invoice-generator.com](https://invoice-generator.com) to try the application.

## Technology Stack

- Vanilla JavaScript (ES6+)
- Vite for building and development
- PDF generation with jsPDF
- SweetAlert2 for notifications
- CSS3 with custom properties for theming

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/invoice-generator.git
cd invoice-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Building for Production

1. Build the project:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

The built files will be in the `dist` directory, ready for deployment.

## Deployment

### Static Hosting (Recommended)

The built application is static and can be deployed to any static hosting service:

1. Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. Vercel:
   - Import your repository
   - Build command will be automatically detected
   - Deploy

3. GitHub Pages:
   - Set base in vite.config.js to match your repository name
   - Run: `npm run build`
   - Deploy the `dist` directory

### Self-Hosted

1. Build the project: `npm run build`
2. Copy the contents of `dist` to your web server
3. Configure your web server to serve the files

For Apache, create a .htaccess file in the root:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

For Nginx, in your server block:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

The application is optimized for performance:
- JavaScript and CSS minification
- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Gzip compression (when served correctly)

## SEO Optimization

- Semantic HTML structure
- Meta tags optimization
- robots.txt configuration
- XML sitemap
- Open Graph tags for social sharing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request

## Support

For support, email support@invoice-generator.com or open an issue in the GitHub repository.