// SnowflakeGenerator.js
// Generates snowflakes from SVG assets based on weather conditions
// Snowflakes only appear when conditions are snowing

const fs = require('fs');
const path = require('path');

class SnowflakeGenerator {
  constructor(weatherData, randomFn, screenW = 1080, screenH = 1350) {
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    // Load all snowflake SVG assets
    this.snowflakeAssets = [];
    this.loadSnowflakeAssets();
    
    // Initialize snowflakes based on weather
    this.snowflakes = [];
    this.initSnowflakes();
  }
  
  // Load all snowflake SVG files from svg-assets folder
  loadSnowflakeAssets() {
    const assetsDir = path.join(__dirname, '..', 'svg-assets');
    
    try {
      const files = fs.readdirSync(assetsDir);
      const snowflakeFiles = files.filter(file => 
        file.startsWith('snowflake_') && file.endsWith('.svg')
      );
      
      for (const file of snowflakeFiles) {
        const filePath = path.join(assetsDir, file);
        const svgContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract path data from SVG
        const paths = this.extractPathsFromSVG(svgContent);
        if (paths.length > 0) {
          // Extract viewBox for scaling reference
          const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
          const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, 19.44, 22.069];
          
          this.snowflakeAssets.push({
            name: file,
            paths: paths,
            viewBox: viewBox,
            width: viewBox[2],
            height: viewBox[3]
          });
        }
      }
      
      console.log(`Loaded ${this.snowflakeAssets.length} snowflake assets`);
    } catch (error) {
      console.error('Error loading snowflake assets:', error);
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
      const fill = fillMatch ? fillMatch[1] : '#FFFFFF';
      
      paths.push({
        d: pathData,
        fill: fill
      });
    }
    
    return paths;
  }
  
  // Initialize snowflakes based on weather conditions
  initSnowflakes() {
    const { ottawa, tokyo } = this.weatherData;
    
    // Get weather conditions - prefer condition ID if available, fallback to description parsing
    const ottawaCondition = this.getWeatherCondition(ottawa.description, ottawa.id, ottawa.main);
    const tokyoCondition = this.getWeatherCondition(tokyo.description, tokyo.id, tokyo.main);
    
    // Only generate snowflakes if conditions are snowing
    const isSnowing = ottawaCondition === 'SNOW' || tokyoCondition === 'SNOW';
    
    if (!isSnowing) {
      console.log('No snow conditions detected - skipping snowflake generation');
      return;
    }
    
    // Debug: log condition detection
    console.log(`Snow condition detection:`);
    console.log(`  Ottawa: "${ottawa.description}" → ${ottawaCondition}`);
    console.log(`  Tokyo: "${tokyo.description}" → ${tokyoCondition}`);
    
    // Determine snow intensity based on condition IDs
    const ottawaIntensity = this.getSnowIntensity(ottawa.id, ottawaCondition);
    const tokyoIntensity = this.getSnowIntensity(tokyo.id, tokyoCondition);
    
    // Use the higher intensity if both cities are snowing
    let snowIntensity;
    if (ottawaCondition === 'SNOW' && tokyoCondition === 'SNOW') {
      // Both cities snowing - use the higher intensity
      snowIntensity = this.getHigherIntensity(ottawaIntensity, tokyoIntensity);
    } else if (ottawaCondition === 'SNOW') {
      snowIntensity = ottawaIntensity;
    } else if (tokyoCondition === 'SNOW') {
      snowIntensity = tokyoIntensity;
    } else {
      snowIntensity = 'MODERATE'; // Fallback
    }
    
    // Determine number of snowflakes, size, and opacity based on intensity
    let numSnowflakes, minScale, maxScale, minOpacity, maxOpacity;
    
    if (snowIntensity === 'HEAVY') {
      // Heavy snow: many large snowflakes
      numSnowflakes = Math.floor(this.random(150, 300));
      minScale = 0.5;
      maxScale = 2.0;
      minOpacity = 0.7;
      maxOpacity = 1.0;
    } else if (snowIntensity === 'MODERATE') {
      // Moderate snow: medium amount of medium snowflakes
      numSnowflakes = Math.floor(this.random(80, 150));
      minScale = 0.3;
      maxScale = 1.5;
      minOpacity = 0.6;
      maxOpacity = 0.9;
    } else {
      // Light snow: fewer small snowflakes
      numSnowflakes = Math.floor(this.random(40, 80));
      minScale = 0.2;
      maxScale = 1.0;
      minOpacity = 0.5;
      maxOpacity = 0.8;
    }
    
    console.log(`Snow intensity: ${snowIntensity} (Ottawa: ${ottawaIntensity}, Tokyo: ${tokyoIntensity}) - ${numSnowflakes} snowflakes`);
    
    // Generate snowflake instances
    for (let i = 0; i < numSnowflakes; i++) {
      // Randomly select a snowflake asset
      if (this.snowflakeAssets.length === 0) continue;
      
      const assetIndex = Math.floor(this.random(0, this.snowflakeAssets.length));
      const asset = this.snowflakeAssets[assetIndex];
      
      // Determine opacity based on intensity
      const opacity = this.random(minOpacity, maxOpacity);
      
      // Snowflakes are white/light colors
      const color = '#FFFFFF'; // Pure white for snowflakes
      
      // Position snowflake across entire canvas (snow falls everywhere)
      const x = this.random(0, this.SCRN_W);
      const y = this.random(0, this.SCRN_H);
      
      // Scale snowflake based on intensity
      const baseScale = this.random(minScale, maxScale);
      const scaleX = baseScale * this.random(0.9, 1.1);
      const scaleY = baseScale * this.random(0.9, 1.1);
      
      // Optional rotation for variety (snowflakes can rotate as they fall)
      const rotation = this.random(0, 360);
      
      this.snowflakes.push({
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
    
    console.log(`Weather-based snowflakes initialized: ${numSnowflakes} snowflakes`);
  }
  
  // Get all snowflakes with their Y positions for depth sorting
  getSnowflakesWithDepth() {
    return this.snowflakes.map(snowflake => ({
      snowflake: snowflake,
      y: snowflake.y, // Y position of the snowflake
      type: 'snowflake'
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
  
  // Get snow intensity based on condition ID
  getSnowIntensity(id, condition) {
    if (condition !== 'SNOW') return 'MODERATE';
    
    if (!id) return 'MODERATE'; // No ID available, default to moderate
    
    // Light snow: light snow and light shower snow
    if (id === 600 ||                // Light snow
        id === 612 ||                // Light shower sleet
        id === 615 ||                // Light rain and snow
        id === 620) {                // Light shower snow
      return 'LIGHT';
    }
    
    // Heavy snow: heavy snow and heavy shower snow
    if (id === 602 ||                // Heavy snow
        id === 622) {                // Heavy shower snow
      return 'HEAVY';
    }
    
    // Moderate snow: everything else (601, 611, 613, 616, 621, etc.)
    if (id >= 600 && id < 700) {
      return 'MODERATE';
    }
    
    return 'MODERATE'; // Default fallback
  }
  
  // Compare two snow intensities and return the higher one
  getHigherIntensity(intensity1, intensity2) {
    const intensityOrder = { 'LIGHT': 1, 'MODERATE': 2, 'HEAVY': 3 };
    const order1 = intensityOrder[intensity1] || 2;
    const order2 = intensityOrder[intensity2] || 2;
    return order1 >= order2 ? intensity1 : intensity2;
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
  
  // Add snowflakes to SVG elements array
  addToSVG(svgElements) {
    for (const snowflake of this.snowflakes) {
      const { asset, x, y, scaleX, scaleY, rotation, opacity, color } = snowflake;
      
      // Create a group for this snowflake with transform
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
      
      // Render each path in the snowflake asset
      for (const path of asset.paths) {
        // Use white color for snowflakes
        const pathElement = `    <path d="${path.d}" fill="${color}"/>`;
        svgElements.push(pathElement);
      }
      
      // Close group
      svgElements.push(`  </g>`);
    }
  }
}

module.exports = SnowflakeGenerator;

