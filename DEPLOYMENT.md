# Deployment Guide - Economic Analysis Tool

## 🚀 Quick Deployment to Vercel

### Step 1: MongoDB Setup

#### Option A: MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (Free tier available)
4. Create a database user:
   - Go to "Database Access"
   - Add new database user
   - Choose username/password authentication
   - Note down the username and password
5. Configure network access:
   - Go to "Network Access"
   - Add IP address `0.0.0.0/0` (allows access from anywhere - suitable for Vercel)
6. Get your connection string:
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your actual values

#### Option B: Local MongoDB (Development Only)
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community
brew services start mongodb/brew/mongodb-community

# Connection string will be:
# mongodb://localhost:27017/economic-analysis
```

### Step 2: Deploy to Vercel

#### Method 1: GitHub Integration (Recommended)
1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit: Economic Analysis Tool"
git push origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: Generate a random secret (use: `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Your Vercel domain (will be provided after deployment)

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts and add environment variables when asked
```

### Step 3: Environment Variables in Vercel

1. In your Vercel project dashboard:
   - Go to "Settings" → "Environment Variables"
   - Add the following variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/economic-analysis
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### Step 4: Verify Deployment

1. Visit your deployed URL
2. Test the following features:
   - Create a new project in "Cost Calculator"
   - View projects in "Projects" tab
   - Check dashboard analytics
   - Verify data persistence

## 🛠️ Development Workflow

### Local Development
```bash
# Clone and setup
git clone <your-repo>
cd economic-analysis-tool
npm install

# Create .env.local
echo "MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000" > .env.local

# Start development server
npm run dev
```

### Testing Before Deployment
```bash
# Build and test locally
npm run build
npm run start

# Run linting
npm run lint
```

### Continuous Deployment
- Every push to `main` branch triggers automatic deployment
- Check deployment status in Vercel dashboard
- View build logs for any issues

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: MongooseError: Operation `projects.find()` buffering timed out
```
**Solution:**
- Check MongoDB URI format
- Verify network access settings in MongoDB Atlas
- Ensure username/password are correct

#### 2. Environment Variables Not Found
```
Error: Please define the MONGODB_URI environment variable
```
**Solution:**
- Add environment variables in Vercel dashboard
- Redeploy after adding variables
- Check variable names for typos

#### 3. Build Errors
```
Type error: Cannot find module '@/components/...'
```
**Solution:**
- Ensure all component files are committed
- Check import paths for case sensitivity
- Verify TypeScript configuration

#### 4. Mongoose Connection Issues
```
MongooseError: Connection closed
```
**Solution:**
- Use MongoDB Atlas instead of local MongoDB
- Check connection string format
- Verify cluster is running

### Performance Optimization

1. **Database Optimization:**
   - Index frequently queried fields
   - Use projection to limit returned data
   - Implement pagination for large datasets

2. **Frontend Optimization:**
   - Components are already optimized with React 19
   - Chart.js lazy loading implemented
   - Tailwind CSS for minimal bundle size

3. **API Optimization:**
   - Connection pooling with Mongoose
   - Error handling and validation
   - Optimized for Vercel's serverless functions

## 📊 Monitoring and Analytics

### Vercel Analytics
- Enable Web Analytics in Vercel dashboard
- Monitor performance and user engagement
- Track deployment frequency and success rate

### Database Monitoring
- Use MongoDB Atlas monitoring
- Set up alerts for connection issues
- Monitor query performance

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit `.env.local` to version control
   - Use strong secrets for NEXTAUTH_SECRET
   - Rotate secrets periodically

2. **Database Security:**
   - Use MongoDB Atlas for production
   - Implement proper user authentication
   - Regular security updates

3. **API Security:**
   - Input validation implemented
   - Error handling prevents information leakage
   - Rate limiting through Vercel

## 📈 Scaling Considerations

### Database Scaling
- MongoDB Atlas auto-scaling available
- Consider sharding for large datasets
- Implement caching strategies

### Application Scaling
- Vercel handles auto-scaling
- Consider CDN for static assets
- Monitor performance metrics

---

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify MongoDB Atlas connectivity
3. Test locally with same environment variables
4. Contact support with specific error messages

**Happy Deploying! 🚀** 