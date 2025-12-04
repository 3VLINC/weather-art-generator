# Weather Art Generator

A web application that generates unique digital artwork based on real-time weather data from Ottawa, Canada, and Tokyo, Japan. Built with open-source tools including p5.js for generative art and Node.js for the backend.

## Features

- 🌤️ Real-time weather data from Ottawa and Tokyo
- 🎨 Unique generative artwork created in the browser using p5.js
- 📧 Email delivery of artwork as PNG attachment
- 📱 Responsive design for all devices
- 🔄 Generate multiple variations of artwork

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, p5.js
- **Backend**: Node.js, Express.js
- **APIs**: OpenWeatherMap (weather data)
- **Email**: Nodemailer (Gmail SMTP)
- **Hosting**: Vercel/Netlify (free tier)

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenWeatherMap API key (free at openweathermap.org)
- Gmail account with App Password enabled

### 2. Installation

```bash
# Clone or download the project
cd weather-art-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Environment Configuration

Edit the `.env` file with your credentials:

```env
# Get your free API key from openweathermap.org
OPENWEATHER_API_KEY=your_api_key_here

# Gmail configuration (use App Password, not regular password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Server configuration
PORT=3000
NODE_ENV=development
DOMAIN_URL=http://localhost:3000
```

### 4. Gmail App Password Setup

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security > App passwords
3. Generate a new app password for "Mail"
4. Use this password in your `.env` file

### 5. Running the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Visit `http://localhost:3000` to see the application.

## Testing on macOS

### Option 1: Using Node.js (Recommended)

```bash
# Install Node.js if not already installed
brew install node

# Navigate to project directory
cd weather-art-app

# Install dependencies
npm install

# Start the server
npm start
```

### Option 2: Using MAMP (Alternative)

If you prefer using MAMP:

1. Place the project files in your MAMP `htdocs` directory
2. Install Node.js dependencies: `npm install`
3. Start MAMP and run: `node server.js`
4. Access via `http://localhost:8888` (MAMP port)

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard
5. Connect your custom domain in Vercel settings

### Netlify

1. Build the project (if needed)
2. Drag and drop the project folder to Netlify
3. Configure environment variables
4. Connect your custom domain

## Project Structure

```
weather-art-app/
├── public/
│   ├── index.html          # Main HTML file
│   ├── app.js             # Main application logic
│   └── artwork.js         # p5.js artwork generation
├── server.js              # Express server
├── package.json           # Dependencies
├── .env.example          # Environment template
└── README.md             # This file
```

## How It Works

1. **Weather Data**: Fetches real-time weather from OpenWeatherMap API for Ottawa and Tokyo
2. **Art Generation**: Uses p5.js to create unique artwork based on weather parameters:
   - Temperature affects curve patterns
   - Humidity controls particle density
   - Wind speed influences line patterns
   - Weather conditions determine colors and shapes
3. **Email Delivery**: Converts artwork to PNG and sends as email attachment

## Customization

### Adding More Cities

Edit `server.js` to add more cities:

```javascript
const cities = [
    { name: 'Ottawa', country: 'CA' },
    { name: 'Tokyo', country: 'JP' },
    { name: 'London', country: 'GB' }
];
```

### Modifying Art Styles

Edit `artwork.js` to change the generative art algorithms:

- Modify `drawWeatherPatterns()` for different visual styles
- Adjust `getWeatherColor()` for different color schemes
- Add new shape functions in `drawCityPattern()`

## Troubleshooting

### Common Issues

1. **Weather API Error**: Check your OpenWeatherMap API key
2. **Email Not Sending**: Verify Gmail App Password setup
3. **CORS Issues**: Ensure server is running on correct port
4. **Canvas Not Loading**: Check browser console for p5.js errors

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design included

## License

MIT License - Feel free to use and modify for your projects.

## Contributing

This is an open-source project. Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Share your artwork variations

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify all environment variables are set correctly
4. Test with a simple email first
