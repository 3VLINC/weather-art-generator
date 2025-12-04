const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const SVGArtGenerator = require('./server-svg-generator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for artwork data
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// Email transporter setup - try multiple configurations
let transporter;

console.log('Email configuration debug:');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

if (process.env.EMAIL_SERVICE === 'sendgrid') {
  console.log('Using SendGrid configuration');
  // SendGrid configuration (more reliable than Gmail)
  transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else if (process.env.EMAIL_SERVICE === 'gmail') {
  console.log('Using Gmail configuration');
  // Gmail configuration
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('Using default Gmail configuration');
  // Default to Gmail for backward compatibility
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Weather API key not configured' });
    }
    
    // Fetch weather data for Ottawa and Tokyo
    const [ottawaResponse, tokyoResponse] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Ottawa,CA&appid=${apiKey}&units=metric`),
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Tokyo,JP&appid=${apiKey}&units=metric`)
    ]);

    const weatherData = {
      ottawa: {
        temperature: ottawaResponse.data.main.temp,
        humidity: ottawaResponse.data.main.humidity,
        pressure: ottawaResponse.data.main.pressure,
        windSpeed: ottawaResponse.data.wind.speed,
        description: ottawaResponse.data.weather[0].description,
        icon: ottawaResponse.data.weather[0].icon
      },
      tokyo: {
        temperature: tokyoResponse.data.main.temp,
        humidity: tokyoResponse.data.main.humidity,
        pressure: tokyoResponse.data.main.pressure,
        windSpeed: tokyoResponse.data.wind.speed,
        description: tokyoResponse.data.weather[0].description,
        icon: tokyoResponse.data.weather[0].icon
      }
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Generate artwork endpoint - SVG first, then rasterize
app.post('/api/generate-artwork', async (req, res) => {
  try {
    const { weatherData } = req.body;
    
    if (!weatherData) {
      return res.status(400).json({ error: 'Weather data required' });
    }
    
    console.log('Generating artwork server-side (SVG first)...');
    
    // Generate seed based on weather data (same algorithm as client)
    const createSeed = (ottawa, tokyo) => {
      const seedStr = `${ottawa.temperature}${ottawa.humidity}${ottawa.pressure}${tokyo.temperature}${tokyo.humidity}${tokyo.pressure}${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        const char = seedStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };
    
    const seed = createSeed(weatherData.ottawa, weatherData.tokyo);
    
    // Generate color variations (same algorithm as client)
    // We'll use a simple seeded random for this
    let randomState = seed;
    const random = (min, max) => {
      randomState = (randomState * 1103515245 + 12345) & 0x7fffffff;
      const rnd = randomState / 0x7fffffff;
      return min + rnd * (max - min);
    };
    
    const colorVariations = {
      background: random(0.9, 1.1),
      saturation: random(0.8, 1.2),
      brightness: random(0.9, 1.1)
    };
    
    console.log('Generated seed:', seed, 'colorVariations:', colorVariations);
    
    // Generate SVG
    const svgGenerator = new SVGArtGenerator(weatherData, seed, colorVariations);
    const svgContent = svgGenerator.generate();
    console.log('✅ SVG generated, length:', svgContent.length);
    
    // Convert SVG to PNG using sharp
    let pngBuffer;
    try {
      const sharp = require('sharp');
      pngBuffer = await sharp(Buffer.from(svgContent, 'utf8'))
        .png()
        .toBuffer();
      console.log('✅ SVG converted to PNG, buffer size:', pngBuffer.length, 'bytes');
    } catch (sharpError) {
      console.error('❌ Error converting SVG to PNG with sharp:', sharpError.message);
      // If sharp fails, we can't generate PNG - return error
      return res.status(500).json({ error: 'Failed to convert SVG to PNG. Sharp library may need librsvg.' });
    }
    
    // Convert PNG buffer to base64 data URL
    const pngBase64 = pngBuffer.toString('base64');
    const pngDataUrl = `data:image/png;base64,${pngBase64}`;
    
    // Return PNG data URL, seed, and colorVariations to client
    res.json({
      artworkDataUrl: pngDataUrl,
      seed: seed,
      colorVariations: colorVariations
    });
    
  } catch (error) {
    console.error('Error generating artwork:', error);
    res.status(500).json({ error: 'Failed to generate artwork' });
  }
});

// Counter file path
const COUNTER_FILE = path.join(__dirname, 'artwork-counter.json');

// Initialize or read counter file
function getCounter() {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = fs.readFileSync(COUNTER_FILE, 'utf8');
      const counter = JSON.parse(data);
      return counter.count || 0;
    }
  } catch (error) {
    console.error('Error reading counter file:', error);
  }
  return 0;
}

// Increment and save counter
function incrementCounter() {
  try {
    let count = getCounter();
    count += 1;
    
    const data = {
      count: count,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2), 'utf8');
    return count;
  } catch (error) {
    console.error('Error writing counter file:', error);
    // Fallback: return timestamp-based number if file write fails
    return Date.now();
  }
}

// Email sending endpoint
app.post('/api/send-artwork', async (req, res) => {
  try {
    console.log('Email request received, body size:', JSON.stringify(req.body).length);
    const { email, artworkDataUrl, svgData, weatherData, seed, colorVariations } = req.body;

    // Log what we received
    console.log('Request data:', {
      hasEmail: !!email,
      hasArtworkDataUrl: !!artworkDataUrl,
      hasSvgData: !!svgData,
      svgDataType: typeof svgData,
      svgDataLength: svgData ? (typeof svgData === 'string' ? svgData.length : 'not a string') : 0,
      hasWeatherData: !!weatherData
    });

    // Validate required fields
    if (!email || !artworkDataUrl || !weatherData) {
      console.log('Missing required fields:', { email: !!email, artworkDataUrl: !!artworkDataUrl, weatherData: !!weatherData });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email configuration is set up
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM) {
        console.log('SendGrid configuration missing');
        return res.status(500).json({ error: 'SendGrid configuration not set up' });
      }
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_FROM) {
        console.log('Gmail configuration missing');
        return res.status(500).json({ error: 'Gmail configuration not set up' });
      }
    }

    // Get and increment counter for tracking (only after validation passes)
    const artworkNumber = incrementCounter();
    const trackingId = `#${artworkNumber}`;
    console.log('Counter incremented to:', artworkNumber);

    let buffer;
    let svgPath = null;

    // Generate SVG file - either from client or server-side
    console.log('Checking for SVG data:', !!svgData, 'SVG data type:', typeof svgData, 'SVG data length:', svgData ? (typeof svgData === 'string' ? svgData.length : 'not a string') : 0);
    console.log('Server-side SVG generation available:', !!(seed && colorVariations && weatherData));
    
    // Check if svgData is a valid non-empty string from client
    const hasValidSvgData = svgData && typeof svgData === 'string' && svgData.trim().length > 0 && svgData.includes('<svg');
    
    // If client didn't provide SVG, generate it server-side
    let svgContent = null;
    if (hasValidSvgData) {
      svgContent = svgData; // Use client-provided SVG
      console.log('✅ Using client-provided SVG');
    } else if (seed && colorVariations && weatherData) {
      // Generate SVG server-side as fallback
      console.log('🔄 Generating SVG server-side (p5.SVG not working on client)...');
      try {
        const svgGenerator = new SVGArtGenerator(weatherData, seed, colorVariations);
        svgContent = svgGenerator.generate();
        console.log('✅ SVG generated server-side, length:', svgContent.length);
      } catch (error) {
        console.error('❌ Error generating SVG server-side:', error);
        svgContent = null;
      }
    }
    
    if (svgContent) {
      console.log('✅ Valid SVG data detected, proceeding to save...');
      try {
        // Create svgs directory if it doesn't exist
        const svgsDir = path.join(__dirname, 'svgs', trackingId);
        console.log('Creating SVG directory:', svgsDir);
        if (!fs.existsSync(svgsDir)) {
          fs.mkdirSync(svgsDir, { recursive: true });
          console.log('Created SVG directory');
        }
        
        // Save SVG file
        const svgFilename = `eepmon-weatherart${trackingId}.svg`;
        svgPath = path.join(svgsDir, svgFilename);
        console.log('Saving SVG to:', svgPath);
        fs.writeFileSync(svgPath, svgContent, 'utf8');
        console.log(`✅ SVG saved: ${svgPath}`);
        
        // Verify file was saved
        if (fs.existsSync(svgPath)) {
          const stats = fs.statSync(svgPath);
          console.log(`✅ SVG file verified: ${stats.size} bytes`);
        } else {
          console.error('❌ SVG file was not created!');
        }
        
        // Convert SVG to PNG for email attachment
        // Note: sharp requires librsvg for SVG support, which may not be available
        // So we'll use the PNG that was already converted in the browser
        if (artworkDataUrl) {
          const base64Data = artworkDataUrl.replace(/^data:image\/png;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
          console.log('Using browser-converted PNG, buffer size:', buffer.length, 'bytes');
        } else {
          // Try sharp as fallback (may not work without librsvg)
          try {
            const sharp = require('sharp');
            const svgBuffer = Buffer.from(svgContent, 'utf8');
            buffer = await sharp(svgBuffer)
              .png()
              .toBuffer();
            console.log('SVG converted to PNG with sharp, buffer size:', buffer.length, 'bytes');
          } catch (sharpError) {
            console.error('Error converting SVG to PNG with sharp:', sharpError.message);
            // Don't throw - use artworkDataUrl if available
            if (artworkDataUrl) {
              const base64Data = artworkDataUrl.replace(/^data:image\/png;base64,/, '');
              buffer = Buffer.from(base64Data, 'base64');
              console.log('Using artworkDataUrl fallback, buffer size:', buffer.length, 'bytes');
            } else {
              throw new Error('Could not convert SVG to PNG - no PNG data available');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error saving SVG:', error);
        console.error('Error stack:', error.stack);
        // Still try to save SVG even if there was an error with PNG conversion
        if (svgPath && svgContent) {
          try {
            fs.writeFileSync(svgPath, svgContent, 'utf8');
            console.log(`✅ SVG saved after error recovery: ${svgPath}`);
          } catch (saveError) {
            console.error('❌ Failed to save SVG even after error recovery:', saveError);
          }
        }
        // Fallback to PNG if available
        if (artworkDataUrl) {
          const base64Data = artworkDataUrl.replace(/^data:image\/png;base64,/, '');
          buffer = Buffer.from(base64Data, 'base64');
          console.log('Using PNG fallback due to SVG error, buffer size:', buffer.length, 'bytes');
        } else {
          return res.status(500).json({ error: 'Failed to process artwork' });
        }
      }
    } else {
      console.log('⚠️ No valid SVG data provided, skipping SVG file save');
      console.log('  - svgData exists:', !!svgData);
      console.log('  - svgData type:', typeof svgData);
      console.log('  - svgData is string:', typeof svgData === 'string');
      if (svgData && typeof svgData === 'string') {
        console.log('  - svgData length:', svgData.length);
        console.log('  - svgData starts with:', svgData.substring(0, 50));
      }
    }
    
    // Ensure we have a buffer for the email attachment
    if (!buffer) {
      if (artworkDataUrl) {
        // Use provided PNG data
        const base64Data = artworkDataUrl.replace(/^data:image\/png;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
        console.log('Using provided PNG for email attachment, buffer size:', buffer.length, 'bytes');
      } else {
        console.error('❌ No buffer and no artworkDataUrl - cannot send email');
        return res.status(400).json({ error: 'No artwork data provided (neither SVG nor PNG)' });
      }
    }
    
    // Final check - ensure buffer exists before sending email
    if (!buffer) {
      console.error('❌ Buffer is still null after all attempts - cannot send email');
      return res.status(500).json({ error: 'Failed to create artwork attachment' });
    }
    
    console.log('✅ Buffer ready for email attachment, size:', buffer.length, 'bytes');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'EEPMON ジェネラティブアート │ Generative Art │ Art génératif',
      html: `
        <h2>プリンス高円宮ギャラリー限定のEEPMON「ウェザーアートジェネレーター」をご利用いただきありがとうございます！</h2>
        <p>こちらが、オタワと東京の天気から生まれた、あなただけのユニークな生成アートです。</p>
        
        <h3>Weather Data Used:</h3>
        <ul>
          <li><strong>オタワ:</strong> ${weatherData.ottawa.temperature}°C, ${weatherData.ottawa.description}</li>
          <li><strong>東京:</strong> ${weatherData.tokyo.temperature}°C, ${weatherData.tokyo.description}</li>
        </ul>
        
        <p>This artwork was generated using real-time weather data and p5.js generative art algorithms.</p>
        <p><small>Your artwork unique ID is ${trackingId}</small></p>
        <p>Enjoy your unique creation!</p>
        <br/><hr><br/>

        <h2>Thank you for using Weather Art Generator!</h2>
        <p>Here's your unique digital artwork inspired by the weather in Ottawa and Tokyo.</p>
        
        <h3>Weather Data Used:</h3>
        <ul>
          <li><strong>Ottawa:</strong> ${weatherData.ottawa.temperature}°C, ${weatherData.ottawa.description}</li>
          <li><strong>Tokyo:</strong> ${weatherData.tokyo.temperature}°C, ${weatherData.tokyo.description}</li>
        </ul>
        
        <p>This artwork was generated using real-time weather data and p5.js generative art algorithms.</p>
        <p><small>Your artwork unique ID is ${trackingId}</small></p>
        <p>Enjoy your unique creation!</p>
        <br/><hr><br/>

        <h2>Merci d’avoir utilisé le générateur d’art météo EEPMON, exclusivement à la Galerie Prince Takamado !</h2>
        <p>Voici votre œuvre générative unique inspirée de la météo à Ottawa et Tokyo.</p>
        
        <h3>Weather Data Used:</h3>
        <ul>
          <li><strong>Ottawa:</strong> ${weatherData.ottawa.temperature}°C, ${weatherData.ottawa.description}</li>
          <li><strong>Tokyo:</strong> ${weatherData.tokyo.temperature}°C, ${weatherData.tokyo.description}</li>
        </ul>
        
        <p>This artwork was generated using real-time weather data and p5.js generative art algorithms.</p>
        <p><small>Your artwork unique ID is ${trackingId}</small></p>
        <p>Enjoy your unique creation!</p>

      `,
      attachments: [{
        filename: 'weather-artwork.png',
        content: buffer,
        contentType: 'image/png'
      }]
    };

    const timestamp = new Date().toISOString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 EMAIL SENT - Artwork #${artworkNumber}`);
    console.log(`   Email: ${email}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Ottawa: ${weatherData.ottawa.temperature}°C, ${weatherData.ottawa.description}`);
    console.log(`   Tokyo: ${weatherData.tokyo.temperature}°C, ${weatherData.tokyo.description}`);
    console.log(`   Total artworks generated: ${artworkNumber}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Artwork sent successfully!',
      trackingId: trackingId // Return tracking ID to client (optional)
    });
  } catch (error) {
    console.error('Email Error:', error.message);
    console.error('Full error:', error);
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      res.status(500).json({ error: 'Email authentication failed. Check your Gmail app password.' });
    } else if (error.code === 'ECONNECTION') {
      res.status(500).json({ error: 'Email connection failed. Check your internet connection.' });
    } else {
      res.status(500).json({ error: `Failed to send email: ${error.message}` });
    }
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure to set up your .env file with API keys`);
});
