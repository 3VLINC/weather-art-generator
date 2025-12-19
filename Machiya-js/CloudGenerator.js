// CloudGenerator.js
// Generates clouds from SVG assets based on weather conditions
// Clouds appear between moon and shoji grids for depth effect

const fs = require('fs');
const path = require('path');

class CloudGenerator {
  constructor(weatherData, randomFn, screenW = 1080, screenH = 1350) {
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    // Load all cloud SVG assets
    this.cloudAssets = [];
    this.loadCloudAssets();
    
    // Initialize clouds based on weather
    this.clouds = [];
    this.initClouds();
  }
  
  // Load all cloud SVG files from svg-assets folder
  loadCloudAssets() {
    const assetsDir = path.join(__dirname, '..', 'svg-assets');
    
    try {
      const files = fs.readdirSync(assetsDir);
      const cloudFiles = files.filter(file => 
        file.startsWith('cloud_') && file.endsWith('.svg')
      );
      
      for (const file of cloudFiles) {
        const filePath = path.join(assetsDir, file);
        const svgContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract path data from SVG
        const paths = this.extractPathsFromSVG(svgContent);
        if (paths.length > 0) {
          // Extract viewBox for scaling reference
          const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
          const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, 647, 167.6];
          
          this.cloudAssets.push({
            name: file,
            paths: paths,
            viewBox: viewBox,
            width: viewBox[2],
            height: viewBox[3]
          });
        }
      }
      
      console.log(`Loaded ${this.cloudAssets.length} cloud assets`);
    } catch (error) {
      console.error('Error loading cloud assets:', error);
    }
  }
  
  // Extract path elements from SVG content
  extractPathsFromSVG(svgContent) {
    const paths = [];
    const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = pathRegex.exec(svgContent)) !== null) {
      const pathData = match[1];
      // Extract fill color if present
      const fillMatch = svgContent.substring(match.index).match(/fill="([^"]+)"/);
      const fill = fillMatch ? fillMatch[1] : '#e0d47f';
      
      paths.push({
        d: pathData,
        fill: fill
      });
    }
    
    return paths;
  }
  
  // Initialize clouds based on weather conditions
  initClouds() {
    const { ottawa, tokyo } = this.weatherData;
    const avgHumidity = (ottawa.humidity + tokyo.humidity) / 2;
    
    // Get weather conditions - prefer condition ID if available, fallback to description parsing
    const ottawaCondition = this.getWeatherCondition(ottawa.description, ottawa.id, ottawa.main);
    const tokyoCondition = this.getWeatherCondition(tokyo.description, tokyo.id, tokyo.main);
    
    // Debug: log condition detection
    console.log(`Weather condition detection:`);
    console.log(`  Ottawa: "${ottawa.description}" → ${ottawaCondition}`);
    console.log(`  Tokyo: "${tokyo.description}" → ${tokyoCondition}`);
    
    // Determine number of clouds based on weather conditions
    let numClouds;
    if (ottawaCondition === 'CLOUDY' || tokyoCondition === 'CLOUDY' || 
        ottawaCondition === 'RAIN' || tokyoCondition === 'RAIN' ||
        ottawaCondition === 'STORM' || tokyoCondition === 'STORM') {
      // More clouds for cloudy/rainy/stormy conditions
      numClouds = Math.floor(this.random(8, 15));
    } else if (ottawaCondition === 'PARTLY_CLOUDY' || tokyoCondition === 'PARTLY_CLOUDY') {
      // Moderate clouds for partly cloudy
      numClouds = Math.floor(this.random(4, 8));
    } else if (avgHumidity > 60) {
      // High humidity = more clouds
      numClouds = Math.floor(this.random(3, 7));
    } else {
      // Clear conditions = fewer clouds
      numClouds = Math.floor(this.random(0, 3));
    }
    
    // Generate cloud instances
    for (let i = 0; i < numClouds; i++) {
      // Randomly select a cloud asset
      if (this.cloudAssets.length === 0) continue;
      
      const assetIndex = Math.floor(this.random(0, this.cloudAssets.length));
      const asset = this.cloudAssets[assetIndex];
      
      // Determine opacity based on weather conditions
      let opacity;
      if (ottawaCondition === 'FOG' || tokyoCondition === 'FOG') {
        opacity = this.random(0.3, 0.5); // Lower opacity for fog
      } else if (ottawaCondition === 'STORM' || tokyoCondition === 'STORM') {
        opacity = this.random(0.6, 0.9); // Higher opacity for storms
      } else if (ottawaCondition === 'CLOUDY' || tokyoCondition === 'CLOUDY') {
        opacity = this.random(0.5, 0.8); // Medium-high for cloudy
      } else if (ottawaCondition === 'RAIN' || tokyoCondition === 'RAIN') {
        opacity = this.random(0.4, 0.7); // Medium for rain
      } else {
        opacity = this.random(0.3, 0.6); // Lower for clear/partly cloudy
      }
      
      // Determine color based on weather conditions
      // Use a blend of both cities' conditions for more vibrant colors
      const useAlternate = this.random() > 0.5;
      // Prefer more colorful conditions, or blend them
      let condition;
      if (ottawaCondition === 'CLEAR' || tokyoCondition === 'CLEAR') {
        condition = 'CLEAR'; // Prefer clear (greens/yellows)
      } else if (ottawaCondition === 'RAIN' || tokyoCondition === 'RAIN') {
        condition = 'RAIN'; // Prefer rain (blues)
      } else if (ottawaCondition === 'PARTLY_CLOUDY' || tokyoCondition === 'PARTLY_CLOUDY') {
        condition = 'PARTLY_CLOUDY'; // Prefer partly cloudy (light blues)
      } else {
        // For cloudy/stormy, use a mix or prefer the more interesting one
        condition = tokyoCondition !== 'CLOUDY' ? tokyoCondition : ottawaCondition;
        // If both are cloudy, use PARTLY_CLOUDY for more color
        if (condition === 'CLOUDY') {
          condition = 'PARTLY_CLOUDY';
        }
      }
      const color = this.getConditionColor(condition, useAlternate);
      
      // Debug: log color selection for first few clouds
      if (i < 3) {
        console.log(`Cloud ${i}: condition=${condition}, color=${color}, opacity=${opacity.toFixed(2)}`);
      }
      
      // Position cloud (spread across canvas, with some in upper/middle regions)
      const x = this.random(-100, this.SCRN_W + 100); // Allow overflow for depth
      const y = this.random(this.SCRN_H * 0.1, this.SCRN_H * 0.7); // Upper to middle regions
      
      // Scale cloud (vary size for depth effect)
      const baseScale = this.random(0.4, 1.2);
      const scaleX = baseScale * this.random(0.9, 1.1);
      const scaleY = baseScale * this.random(0.9, 1.1);
      
      // Optional rotation for variety
      const rotation = this.random(-15, 15);
      
      this.clouds.push({
        asset: asset,
        x: x,
        y: y,
        scaleX: scaleX,
        scaleY: scaleY,
        rotation: rotation,
        opacity: opacity,
        color: color
      });
    }
    
    console.log(`Weather-based clouds initialized: ${numClouds} clouds`);
  }
  
  // Get all clouds with their Y positions for depth sorting
  getCloudsWithDepth() {
    return this.clouds.map(cloud => ({
      cloud: cloud,
      y: cloud.y, // Y position of the cloud
      type: 'cloud'
    }));
  }
  
  // Get weather condition from description, condition ID, or main category
  // OpenWeather API provides: id (numeric code), main (category), description (human-readable)
  // Condition IDs: https://openweathermap.org/weather-conditions
  getWeatherCondition(description, conditionId = null, mainCategory = null) {
    // First, try using condition ID if available (most reliable)
    if (conditionId !== null && conditionId !== undefined) {
      return this.getConditionFromId(conditionId);
    }
    
    // Fallback to main category if available
    if (mainCategory) {
      const main = mainCategory.toLowerCase();
      if (main === 'clear') return 'CLEAR';
      if (main === 'clouds') {
        // Need description to distinguish between partly cloudy and overcast
        const desc = (description || '').toLowerCase();
        if (desc.includes('broken') || desc.includes('few') || desc.includes('scattered')) {
          return 'PARTLY_CLOUDY';
        }
        return 'CLOUDY';
      }
      if (main === 'rain' || main === 'drizzle') return 'RAIN';
      if (main === 'snow') return 'SNOW';
      if (main === 'mist' || main === 'fog' || main === 'haze') return 'FOG';
      if (main === 'thunderstorm') return 'STORM';
    }
    
    // Last resort: parse description string
    const desc = (description || '').toLowerCase();
    
    // Check for clear/sunny first
    if (desc.includes('clear') || desc.includes('sunny')) {
      return 'CLEAR';
    }
    
    // Check for rain conditions
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return 'RAIN';
    }
    
    // Check for snow
    if (desc.includes('snow') || desc.includes('sleet')) {
      return 'SNOW';
    }
    
    // Check for fog/mist
    if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) {
      return 'FOG';
    }
    
    // Check for storms
    if (desc.includes('storm') || desc.includes('thunder')) {
      return 'STORM';
    }
    
    // Check for wind (but not if it's part of another condition)
    if (desc.includes('wind') && !desc.includes('snow') && !desc.includes('rain')) {
      return 'WINDY';
    }
    
    // Cloud conditions - check for specific types first
    if (desc.includes('broken clouds') || desc.includes('few clouds') || desc.includes('scattered clouds')) {
      return 'PARTLY_CLOUDY'; // Broken/few/scattered = partly cloudy
    } else if (desc.includes('overcast')) {
      return 'CLOUDY'; // Overcast = fully cloudy
    } else if (desc.includes('cloud')) {
      // Generic cloud - check if it's a partial condition
      if (desc.includes('broken') || desc.includes('few') || desc.includes('scattered')) {
        return 'PARTLY_CLOUDY';
      }
      return 'CLOUDY'; // Default to cloudy if just "cloud" is mentioned
    }
    
    // Default fallback
    return 'PARTLY_CLOUDY';
  }
  
  // Map OpenWeather condition ID to our condition category
  // Official IDs: https://openweathermap.org/weather-conditions
  getConditionFromId(id) {
    // Group 2xx: Thunderstorm
    if (id >= 200 && id < 300) return 'STORM';
    
    // Group 3xx: Drizzle
    if (id >= 300 && id < 400) return 'RAIN';
    
    // Group 5xx: Rain
    if (id >= 500 && id < 600) return 'RAIN';
    
    // Group 6xx: Snow
    if (id >= 600 && id < 700) return 'SNOW';
    
    // Group 7xx: Atmosphere (mist, fog, etc.)
    if (id >= 700 && id < 800) return 'FOG';
    
    // Group 800: Clear
    if (id === 800) return 'CLEAR';
    
    // Group 80x: Clouds
    if (id === 801) return 'PARTLY_CLOUDY'; // few clouds: 11-25%
    if (id === 802) return 'PARTLY_CLOUDY'; // scattered clouds: 25-50%
    if (id === 803) return 'PARTLY_CLOUDY'; // broken clouds: 51-84%
    if (id === 804) return 'CLOUDY'; // overcast clouds: 85-100%
    
    // Default fallback
    return 'PARTLY_CLOUDY';
  }
  
  // Get color palette based on weather condition (same as AbstractLayer)
  getConditionColor(condition, alternate = false) {
    const palettes = {
      'CLEAR': {
        primary: ['#FFD700', '#FFE135', '#ADFF2F', '#9ACD32', '#7CFC00'],
        secondary: ['#FFA500', '#FF8C00', '#32CD32', '#00FF00', '#90EE90']
      },
      'CLOUDY': {
        // More colorful grays with hints of blue/purple
        primary: ['#B0C4DE', '#87CEEB', '#D3D3D3', '#C0C0C0', '#A9A9A9'],
        secondary: ['#E0E6FA', '#DDA0DD', '#F0F8FF', '#E6E6FA', '#DCDCDC']
      },
      'RAIN': {
        primary: ['#4682B4', '#5F9EA0', '#20B2AA', '#00CED1', '#48D1CC'],
        secondary: ['#1E90FF', '#00BFFF', '#87CEEB', '#B0E0E6', '#ADD8E6']
      },
      'SNOW': {
        primary: ['#E6E6FA', '#F0F8FF', '#F8F8FF', '#FFFFFF', '#E0E0E0'],
        secondary: ['#B0C4DE', '#C0C0C0', '#D3D3D3', '#DCDCDC', '#E6E6FA']
      },
      'FOG': {
        primary: ['#C0C0C0', '#D3D3D3', '#DCDCDC', '#E0E0E0', '#F5F5F5'],
        secondary: ['#A9A9A9', '#808080', '#778899', '#708090', '#B0C4DE']
      },
      'STORM': {
        primary: ['#2F4F4F', '#36454F', '#708090', '#778899', '#191970'],
        secondary: ['#000080', '#000033', '#1C1C1C', '#2F2F2F', '#404040']
      },
      'WINDY': {
        primary: ['#E8E8E8', '#F0F0F0', '#F5F5F5', '#FAFAFA', '#FFFFFF'],
        secondary: ['#D3D3D3', '#DCDCDC', '#E0E0E0', '#F8F8FF', '#F0F8FF']
      },
      'PARTLY_CLOUDY': {
        primary: ['#87CEEB', '#B0E0E6', '#E0F6FF', '#F0F8FF', '#E6E6FA'],
        secondary: ['#4682B4', '#5F9EA0', '#ADD8E6', '#D3D3D3', '#F5F5F5']
      }
    };
    
    const palette = palettes[condition] || palettes['PARTLY_CLOUDY'];
    const colors = alternate ? palette.secondary : palette.primary;
    const randomIndex = Math.floor(this.random(0, colors.length));
    return colors[randomIndex];
  }
  
  // Add clouds to SVG elements array
  addToSVG(svgElements) {
    for (const cloud of this.clouds) {
      const { asset, x, y, scaleX, scaleY, rotation, opacity, color } = cloud;
      
      // Create a group for this cloud with transform
      const centerX = x;
      const centerY = y;
      
      // Build transform string for the group
      let transform = `translate(${centerX}, ${centerY})`;
      if (rotation !== 0) {
        transform += ` rotate(${rotation})`;
      }
      transform += ` scale(${scaleX}, ${scaleY})`;
      transform += ` translate(${-asset.width / 2}, ${-asset.height / 2})`;
      
      // Start group
      svgElements.push(`  <g transform="${transform}" opacity="${opacity}">`);
      
      // Render each path in the cloud asset
      for (const path of asset.paths) {
        // Use the weather-based color instead of original fill
        const pathElement = `    <path d="${path.d}" fill="${color}"/>`;
        svgElements.push(pathElement);
      }
      
      // Close group
      svgElements.push(`  </g>`);
    }
  }
}

module.exports = CloudGenerator;

