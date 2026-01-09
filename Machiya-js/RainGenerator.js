// RainGenerator.js
// Generates rain lines based on weather conditions
// Rain only appears when conditions are raining

class RainGenerator {
  constructor(weatherData, randomFn, screenW = 1080, screenH = 1350) {
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    // Initialize rain based on weather
    this.rainLines = [];
    this.initRain();
  }
  
  // Initialize rain based on weather conditions
  initRain() {
    const { ottawa, tokyo } = this.weatherData;
    
    // Get weather conditions - prefer condition ID if available, fallback to description parsing
    const ottawaCondition = this.getWeatherCondition(ottawa.description, ottawa.id, ottawa.main);
    const tokyoCondition = this.getWeatherCondition(tokyo.description, tokyo.id, tokyo.main);
    
    // Only generate rain if conditions are raining
    const isRaining = ottawaCondition === 'RAIN' || tokyoCondition === 'RAIN';
    
    if (!isRaining) {
      console.log('No rain conditions detected - skipping rain generation');
      return;
    }
    
    // Debug: log condition detection
    console.log(`Rain condition detection:`);
    console.log(`  Ottawa: "${ottawa.description}" → ${ottawaCondition}`);
    console.log(`  Tokyo: "${tokyo.description}" → ${tokyoCondition}`);
    
    // Determine rain intensity based on condition IDs
    const ottawaIntensity = this.getRainIntensity(ottawa.id, ottawaCondition);
    const tokyoIntensity = this.getRainIntensity(tokyo.id, tokyoCondition);
    
    // Use the higher intensity if both cities are raining
    let rainIntensity;
    if (ottawaCondition === 'RAIN' && tokyoCondition === 'RAIN') {
      // Both cities raining - use the higher intensity
      rainIntensity = this.getHigherIntensity(ottawaIntensity, tokyoIntensity);
    } else if (ottawaCondition === 'RAIN') {
      rainIntensity = ottawaIntensity;
    } else if (tokyoCondition === 'RAIN') {
      rainIntensity = tokyoIntensity;
    } else {
      rainIntensity = 'MODERATE'; // Fallback
    }
    
    // Determine number of rain lines, thickness, and length based on intensity
    let numRainLines, minThickness, maxThickness, minLength, maxLength;
    
    if (rainIntensity === 'HEAVY') {
      // Heavy rain: many thick, long lines
      numRainLines = Math.floor(this.random(300, 500));
      minThickness = 1.5;
      maxThickness = 3.5;
      minLength = 30;
      maxLength = 50;
    } else if (rainIntensity === 'MODERATE') {
      // Moderate rain: medium amount of medium lines
      numRainLines = Math.floor(this.random(150, 300));
      minThickness = 1.0;
      maxThickness = 2.5;
      minLength = 20;
      maxLength = 40;
    } else {
      // Light rain: fewer thin, short lines
      numRainLines = Math.floor(this.random(50, 150));
      minThickness = 0.5;
      maxThickness = 1.5;
      minLength = 10;
      maxLength = 25;
    }
    
    console.log(`Rain intensity: ${rainIntensity} (Ottawa: ${ottawaIntensity}, Tokyo: ${tokyoIntensity}) - ${numRainLines} lines`);
    
    // Generate rain lines
    for (let i = 0; i < numRainLines; i++) {
      // Position rain line across entire canvas
      const x = this.random(0, this.SCRN_W);
      const y = this.random(0, this.SCRN_H);
      
      // Vary line length based on intensity
      const lineLength = this.random(minLength, maxLength);
      const endY = y + lineLength;
      
      // Vary line thickness based on intensity
      const thickness = this.random(minThickness, maxThickness);
      
      // Rain color - blue/cyan tones, with slight variation
      const blueBase = this.random(100, 200);
      const color = {
        r: Math.floor(blueBase * 0.4),
        g: Math.floor(blueBase * 0.6),
        b: Math.floor(blueBase),
        a: this.random(0.4, 0.8) // Vary opacity for depth
      };
      
      // Slight angle variation (rain rarely falls perfectly straight)
      const angle = this.random(-2, 2); // Small angle in degrees
      const angleRad = (angle * Math.PI) / 180;
      const endX = x + Math.sin(angleRad) * lineLength;
      const actualEndY = y + Math.cos(angleRad) * lineLength;
      
      this.rainLines.push({
        x: x,
        y: y,
        endX: endX,
        endY: actualEndY,
        thickness: thickness,
        color: color
      });
    }
    
    console.log(`Weather-based rain initialized: ${numRainLines} rain lines`);
  }
  
  // Get all rain lines with their Y positions for depth sorting
  getRainLinesWithDepth() {
    return this.rainLines.map(rain => ({
      rain: rain,
      y: rain.y, // Y position of the rain line
      type: 'rain'
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
  
  // Get rain intensity based on condition ID
  getRainIntensity(id, condition) {
    if (condition !== 'RAIN') return 'MODERATE';
    
    if (!id) return 'MODERATE'; // No ID available, default to moderate
    
    // Light rain: drizzle and light rain
    if ((id >= 300 && id <= 301) || // Light drizzle, drizzle
        (id >= 310 && id <= 311) || // Light drizzle rain, drizzle rain
        id === 500 ||                // Light rain
        id === 520) {                // Light intensity shower rain
      return 'LIGHT';
    }
    
    // Heavy rain: heavy intensity and extreme rain
    if ((id >= 302 && id <= 314) || // Heavy drizzle variations
        (id >= 502 && id <= 504) || // Heavy, very heavy, extreme rain
        id === 522 ||                // Heavy intensity shower rain
        id === 531) {                // Ragged shower rain
      return 'HEAVY';
    }
    
    // Moderate rain: everything else (501, 521, etc.)
    if (id >= 300 && id < 600) {
      return 'MODERATE';
    }
    
    return 'MODERATE'; // Default fallback
  }
  
  // Compare two rain intensities and return the higher one
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
  
  // Convert RGB to hex
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  
  // Add rain lines to SVG elements array
  addToSVG(svgElements) {
    for (const rain of this.rainLines) {
      const { x, y, endX, endY, thickness, color } = rain;
      const colorHex = this.rgbToHex(color.r, color.g, color.b);
      
      svgElements.push(
        `  <line x1="${x}" y1="${y}" x2="${endX}" y2="${endY}" stroke="${colorHex}" stroke-width="${thickness}" opacity="${color.a}" />`
      );
    }
  }
}

module.exports = RainGenerator;

