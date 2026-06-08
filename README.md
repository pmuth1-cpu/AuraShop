# Aura Shop

Premium streetwear e-commerce store with admin dashboard.

## Features

- Product catalog with search and filters
- Shopping cart with Telegram checkout
- Admin dashboard for product/category management
- Responsive design with dark mode toggle
- JWT authentication

## Development

```bash
# Install dependencies
npm install

# Start backend server
npm run server

# Start frontend dev server (in another terminal)
npm run dev
```

Open http://localhost:3000

## Production

### Option 1: Render (Recommended)

1. Push to GitHub
2. Sign up at [Render](https://render.com)
3. Create a new Web Service
4. Connect your repository
5. Render auto-detects the `render.yaml` configuration
6. Set `JWT_SECRET` in environment variables (or let Render generate one)

### Option 2: Docker

```bash
docker build -t aura-shop .
docker run -p 5000:5000 -e JWT_SECRET=your-secret aura-shop
```

### Option 3: Manual Deployment

```bash
npm run build
NODE_ENV=production JWT_SECRET=your-secret node server/index.js
```

## Admin Login

- **Username**: `@aurashop369`
- **Password**: `kdmvtrovteroyban`

Default credentials are set in `server/data/admins.json`. Change password after first login.

## Environment Variables

- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens (required for production)
- `NODE_ENV` - `development` or `production`