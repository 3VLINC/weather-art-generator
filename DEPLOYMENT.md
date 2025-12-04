# Weather Art Generator - Deployment Guide

## 🚀 Hosting Options & Recommendations

### 1. **Vercel (Recommended - Free Tier)**
- **Perfect for your use case**: Static frontend + serverless functions
- **Free tier**: 100GB bandwidth, unlimited static sites
- **Custom domain**: Easy setup with your domain
- **Environment variables**: Secure API key management

**Setup Steps:**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure custom domain
4. Deploy automatically on git push

### 2. **Netlify (Alternative - Free Tier)**
- **Free tier**: 100GB bandwidth, 300 build minutes
- **Serverless functions**: For API endpoints
- **Custom domain**: Easy configuration

### 3. **Railway (For Full Node.js App)**
- **Free tier**: $5 credit monthly
- **Full Node.js support**: No serverless limitations
- **Custom domain**: Supported

## 🔧 Environment Setup

### Required Environment Variables:
```bash
OPENWEATHER_API_KEY=your_openweathermap_api_key
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_gmail_address@gmail.com
PORT=3000
NODE_ENV=production
```

### API Keys Setup:

#### 1. OpenWeatherMap API
- Sign up at: https://openweathermap.org/api
- Free tier: 1,000 calls/day
- Get your API key from the dashboard

#### 2. Gmail App Password
- Enable 2-factor authentication on Gmail
- Generate app password: https://myaccount.google.com/apppasswords
- Use this password in EMAIL_PASS (not your regular password)

## 📁 Project Structure
```
weather-art-app/
├── public/                 # Static files
│   ├── index.html         # Main page
│   ├── app.js            # Main application logic
│   └── artwork.js        # p5.js artwork generation
├── server.js             # Express server
├── package.json          # Dependencies
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
├── vercel.json          # Vercel configuration
└── DEPLOYMENT.md        # This file
```

## 🌐 Custom Domain Setup

### For Vercel:
1. Add domain in Vercel dashboard
2. Update DNS records:
   - A record: `76.76.19.61`
   - CNAME: `cname.vercel-dns.com`

### For Netlify:
1. Add domain in Netlify dashboard
2. Update DNS records as provided by Netlify

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **API Keys**: Use environment variables only
3. **CORS**: Configured for your domain only
4. **Rate Limiting**: Consider adding for production
5. **HTTPS**: Automatically handled by hosting platforms

## 📊 Monitoring & Analytics

### Free Options:
- **Vercel Analytics**: Built-in performance monitoring
- **Google Analytics**: Add tracking code to HTML
- **Uptime Robot**: Monitor server availability

## 💰 Cost Breakdown (Monthly)

### Free Tier Usage:
- **Vercel**: $0 (within limits)
- **OpenWeatherMap**: $0 (1,000 calls/day)
- **Gmail**: $0 (personal account)
- **Domain**: ~$10-15/year

### Expected Usage:
- **Bandwidth**: ~1GB/month (light usage)
- **API Calls**: ~500/month (well within limits)
- **Email**: ~100/month (reasonable usage)

## 🚀 Deployment Commands

### Local Development:
```bash
npm install
npm run dev
```

### Production Build:
```bash
npm install --production
npm start
```

### Vercel Deployment:
```bash
npm install -g vercel
vercel --prod
```

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Check domain configuration
2. **Email Not Sending**: Verify app password
3. **API Errors**: Check OpenWeatherMap key
4. **Build Failures**: Check Node.js version compatibility

### Support Resources:
- Vercel Docs: https://vercel.com/docs
- OpenWeatherMap Docs: https://openweathermap.org/api
- p5.js Reference: https://p5js.org/reference/


