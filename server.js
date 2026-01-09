const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
// Using Machiya generator instead of old SVG generator
const ServerMachiyaGenerator = require('./server-machiya-generator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for artwork data
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// Email transporter setup
let transporter;

if (process.env.EMAIL_SERVICE === 'sendgrid') {
  // SendGrid configuration
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else {
  // Gmail configuration (default)
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

    // Log actual API responses for debugging
    console.log('OpenWeather API Response - Ottawa:', {
      main: ottawaResponse.data.weather[0].main,
      description: ottawaResponse.data.weather[0].description,
      id: ottawaResponse.data.weather[0].id
    });
    console.log('OpenWeather API Response - Tokyo:', {
      main: tokyoResponse.data.weather[0].main,
      description: tokyoResponse.data.weather[0].description,
      id: tokyoResponse.data.weather[0].id
    });

    const weatherData = {
      ottawa: {
        temperature: ottawaResponse.data.main.temp,
        humidity: ottawaResponse.data.main.humidity,
        pressure: ottawaResponse.data.main.pressure,
        windSpeed: ottawaResponse.data.wind.speed,
        description: ottawaResponse.data.weather[0].description,
        main: ottawaResponse.data.weather[0].main, // Add main category
        id: ottawaResponse.data.weather[0].id, // Add condition ID
        icon: ottawaResponse.data.weather[0].icon
      },
      tokyo: {
        temperature: tokyoResponse.data.main.temp,
        humidity: tokyoResponse.data.main.humidity,
        pressure: tokyoResponse.data.main.pressure,
        windSpeed: tokyoResponse.data.wind.speed,
        description: tokyoResponse.data.weather[0].description,
        main: tokyoResponse.data.weather[0].main, // Add main category
        id: tokyoResponse.data.weather[0].id, // Add condition ID
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
    
    // Generate SVG using Machiya generator (weather-driven)
    const machiyaGenerator = new ServerMachiyaGenerator(weatherData, seed, colorVariations);
    const svgContent = machiyaGenerator.generate();
    console.log('✅ Machiya SVG generated, length:', svgContent.length);
    
    // Convert SVG to PNG using sharp - ensure exact dimensions 1080x1350
    let pngBuffer;
    try {
      const sharp = require('sharp');
      pngBuffer = await sharp(Buffer.from(svgContent, 'utf8'))
        .resize(1080, 1350, {
          fit: 'fill' // Force exact dimensions without padding
        })
        .png()
        .toBuffer();
      console.log('✅ SVG converted to PNG (1080x1350), buffer size:', pngBuffer.length, 'bytes');
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
// Email tracking file path
const EMAIL_TRACKING_FILE = path.join(__dirname, 'artwork-emails.json');

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

// Check if email has already received an artwork
function hasEmailReceivedArtwork(email) {
  // Exempt eric@eepmon.com from the one artwork rule (for testing)
  if (email.toLowerCase() === 'eric@eepmon.com') {
    console.log('ℹ️  Testing email exempted from one artwork rule:', email);
    return false;
  }
  
  try {
    if (fs.existsSync(EMAIL_TRACKING_FILE)) {
      const data = fs.readFileSync(EMAIL_TRACKING_FILE, 'utf8');
      if (!data.trim()) {
        return false;
      }
      const emails = JSON.parse(data);
      // Check if email exists (case-insensitive)
      return emails.some(entry => entry.email.toLowerCase() === email.toLowerCase());
    }
  } catch (error) {
    console.error('Error reading email tracking file:', error);
  }
  return false;
}

// Add email to tracking file
function addEmailToTracking(email, trackingId) {
  try {
    let emails = [];
    
    // Read existing emails if file exists
    if (fs.existsSync(EMAIL_TRACKING_FILE)) {
      const data = fs.readFileSync(EMAIL_TRACKING_FILE, 'utf8');
      if (data.trim()) {
        emails = JSON.parse(data);
      }
    }
    
    // Check if email already exists (shouldn't happen if we check first, but safety check)
    const emailExists = emails.some(entry => entry.email.toLowerCase() === email.toLowerCase());
    
    if (!emailExists) {
      // Add new email entry
      emails.push({
        email: email,
        trackingId: trackingId,
        receivedAt: new Date().toISOString()
      });
      
      // Save to file
      fs.writeFileSync(EMAIL_TRACKING_FILE, JSON.stringify(emails, null, 2), 'utf8');
      console.log(`✅ Email added to tracking: ${email}`);
    } else {
      console.log(`ℹ️  Email already in tracking file: ${email}`);
    }
  } catch (error) {
    console.error('Error writing email tracking file:', error);
    // Don't throw - tracking failure shouldn't prevent email sending
  }
}

// Email sending endpoint
app.post('/api/send-artwork', async (req, res) => {
  try {
    console.log('Email request received, body size:', JSON.stringify(req.body).length);
    const { email, artworkDataUrl, svgData, weatherData, seed, colorVariations, newsletterOptIn, eepmonNewsOptIn } = req.body;

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

    // Check if email has already received an artwork
    if (hasEmailReceivedArtwork(email)) {
      console.log('Email already received artwork:', email);
      return res.status(400).json({ 
        error: 'This email address has already received an artwork. Only one artwork per email address is allowed.' 
      });
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
      // Generate SVG server-side using Machiya generator
      console.log('🔄 Generating Machiya SVG server-side...');
      try {
        const machiyaGenerator = new ServerMachiyaGenerator(weatherData, seed, colorVariations);
        svgContent = machiyaGenerator.generate();
        console.log('✅ Machiya SVG generated server-side, length:', svgContent.length);
      } catch (error) {
        console.error('❌ Error generating Machiya SVG server-side:', error);
        console.error('Error stack:', error.stack);
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
              .resize(1080, 1350, {
                fit: 'fill' // Force exact dimensions without padding
              })
              .png()
              .toBuffer();
            console.log('SVG converted to PNG (1080x1350) with sharp, buffer size:', buffer.length, 'bytes');
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
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'EEPMON ジェネラティブアート │ Generative Art │ Art génératif',
      html: `
        <h2>プリンス高円宮ギャラリー限定のEEPMON「ウェザーアートジェネレーター」をご利用いただきありがとうございます！</h2>
        <p>こちらが、オタワと東京の天気から生まれた、あなただけのユニークな生成アートです。</p>
        
        <h3>Weather Data Used:</h3>
        <ul>
          <li><strong>オタワ:</strong> ${weatherData.ottawa.temperature}°C, 湿度 ${weatherData.ottawa.humidity}%, ${weatherData.ottawa.description}</li>
          <li><strong>東京:</strong> ${weatherData.tokyo.temperature}°C, 湿度 ${weatherData.tokyo.humidity}%, ${weatherData.tokyo.description}</li>
        </ul>
        
        <p>This artwork was generated using real-time weather data and p5.js generative art algorithms.</p>
        <p><small>Your artwork unique ID is ${trackingId}</small></p>
        <p>Enjoy your unique creation!</p>
        <br/><hr><br/>

        <h2>Thank you for coming to my exhibition, Digital Worlds at the Prince Takamado Gallery.</h2>
        <p>Here's your unique digital artwork inspired by the weather in Ottawa and Tokyo.</p>
        
        <h3>Weather Data Used:</h3>
        <ul>
          <li><strong>Ottawa:</strong> ${weatherData.ottawa.temperature}°C, Humidity ${weatherData.ottawa.humidity}%, ${weatherData.ottawa.description}</li>
          <li><strong>Tokyo:</strong> ${weatherData.tokyo.temperature}°C, Humidity ${weatherData.tokyo.humidity}%, ${weatherData.tokyo.description}</li>
        </ul>
        
        <p>This artwork was generated using real-time weather data and p5.js generative art algorithms.</p>
        <p><small>Your artwork unique ID is ${trackingId}</small></p>
        <p>Enjoy your unique creation!</p>
        <br/><hr><br/>

        <h2>Merci d'avoir utilisé le générateur d'art météo EEPMON, exclusivement à la Galerie Prince Takamado !</h2>
        <p>Voici votre œuvre générative unique inspirée de la météo à Ottawa et Tokyo.</p>
        
        <h3>Weather Data Used:</h3>
        <ul>
          <li><strong>Ottawa:</strong> ${weatherData.ottawa.temperature}°C, Humidité ${weatherData.ottawa.humidity}%, ${weatherData.ottawa.description}</li>
          <li><strong>Tokyo:</strong> ${weatherData.tokyo.temperature}°C, Humidité ${weatherData.tokyo.humidity}%, ${weatherData.tokyo.description}</li>
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

    console.log(`Attempting to send email to ${email}...`);
    
    try {
      const emailResult = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully - Artwork #${artworkNumber} to ${email}`);
      console.log(`   Message ID: ${emailResult.messageId || 'N/A'}`);
      
      // Add email to tracking file (mark as having received artwork)
      addEmailToTracking(email, trackingId);
      
      // Save email to newsletter list if user opted in
      if (newsletterOptIn) {
        try {
          const subscribersFile = path.join(__dirname, 'newsletter-subscribers.json');
          let subscribers = [];
          
          // Read existing subscribers if file exists
          if (fs.existsSync(subscribersFile)) {
            const fileContent = fs.readFileSync(subscribersFile, 'utf8');
            subscribers = JSON.parse(fileContent);
          }
          
          // Check if email already exists
          const emailExists = subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase());
          
          if (!emailExists) {
            // Add new subscriber with timestamp
            subscribers.push({
              email: email,
              subscribedAt: new Date().toISOString(),
              trackingId: trackingId
            });
            
            // Save to file
            fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2), 'utf8');
            console.log(`✅ Newsletter subscriber added: ${email}`);
          } else {
            console.log(`ℹ️  Email already in newsletter list: ${email}`);
          }
        } catch (subscriberError) {
          console.error('⚠️  Error saving newsletter subscriber:', subscriberError.message);
          // Don't fail the request if newsletter saving fails
        }
      }
      
      // Save email to EEPMON news list if user opted in
      if (eepmonNewsOptIn) {
        try {
          const eepmonSubscribersFile = path.join(__dirname, 'eepmon-news-subscribers.json');
          let eepmonSubscribers = [];
          
          // Read existing subscribers if file exists
          if (fs.existsSync(eepmonSubscribersFile)) {
            const fileContent = fs.readFileSync(eepmonSubscribersFile, 'utf8');
            if (fileContent.trim()) {
              eepmonSubscribers = JSON.parse(fileContent);
            }
          }
          
          // Check if email already exists
          const emailExists = eepmonSubscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase());
          
          if (!emailExists) {
            // Add new subscriber with timestamp and tracking ID (for NFT delivery)
            eepmonSubscribers.push({
              email: email,
              subscribedAt: new Date().toISOString(),
              trackingId: trackingId,
              nftEligible: true // Mark as eligible for free NFT
            });
            
            // Save to file
            fs.writeFileSync(eepmonSubscribersFile, JSON.stringify(eepmonSubscribers, null, 2), 'utf8');
            console.log(`✅ EEPMON news subscriber added: ${email} (NFT eligible)`);
          } else {
            console.log(`ℹ️  Email already in EEPMON news list: ${email}`);
          }
        } catch (eepmonError) {
          console.error('⚠️  Error saving EEPMON news subscriber:', eepmonError.message);
          // Don't fail the request if EEPMON subscriber saving fails
        }
      }
      
      res.json({ 
        success: true, 
        message: 'Artwork sent successfully!',
        trackingId: trackingId
      });
    } catch (sendError) {
      console.error('❌ Error during sendMail:', sendError.message);
      console.error('   Error code:', sendError.code);
      console.error('   Full error:', sendError);
      
      // Check for SendGrid specific errors
      if (sendError.response) {
        console.error('   SendGrid response:', sendError.response);
        const responseBody = sendError.response.body || sendError.response;
        if (responseBody && responseBody.errors) {
          const errorMessages = responseBody.errors.map(e => e.message || e).join('; ');
          console.error('   SendGrid errors:', errorMessages);
          return res.status(500).json({ error: `SendGrid error: ${errorMessages}` });
        }
      }
      
      throw sendError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ EMAIL SENDING FAILED');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let errorMessage = `Failed to send email: ${error.message}`;
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Check your Gmail app password or SendGrid API key.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Email connection failed. Check your internet connection.';
    } else if (error.message && error.message.includes('rate limit')) {
      errorMessage = 'Email rate limit exceeded. Please try again later.';
    } else if (error.message && error.message.includes('quota')) {
      errorMessage = 'Email quota exceeded. Please check your SendGrid account limits.';
    }
    
    res.status(500).json({ error: errorMessage });
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
