// AbstractLayer.js
// Lightweight abstract layer generator for Machiya artwork
// Provides several performance-friendly options

class AbstractLayer {
  constructor(weatherData, randomFn, screenW, screenH) {
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
  }
  
  // Option 1: SVG Filter Turbulence (GPU-accelerated, very fast)
  // Uses native SVG filters - no heavy calculations
  generateTurbulenceFilter() {
    const { ottawa, tokyo } = this.weatherData;
    const avgWind = (ottawa.windSpeed + tokyo.windSpeed) / 2;
    const avgHumidity = (ottawa.humidity + tokyo.humidity) / 2;
    
    // Turbulence based on wind and humidity
    const baseFreq = 0.02 + (avgWind / 100) * 0.03;
    const numOctaves = Math.floor(this.map(avgHumidity, 0, 100, 1, 3));
    
    const filterId = 'turbulence-' + Math.random().toString(36).substr(2, 9);
    
    const filterDef = `
    <filter id="${filterId}" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence 
        type="turbulence" 
        baseFrequency="${baseFreq}" 
        numOctaves="${numOctaves}" 
        seed="${Math.floor(this.random(0, 1000))}"
        result="turbulence"/>
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="turbulence" 
        scale="${avgWind * 2}" 
        xChannelSelector="R" 
        yChannelSelector="G"/>
    </filter>`;
    
    return {
      def: filterDef,
      filterId: filterId,
      element: `<rect x="0" y="0" width="${this.SCRN_W}" height="${this.SCRN_H}" fill="url(#turbulence-gradient)" filter="url(#${filterId})" opacity="0.15"/>`
    };
  }
  
  // Option 2: Sparse Geometric Overlay (lines and rectangles)
  // Scales with wind speed tiers - more elements and complexity at higher wind speeds
  // Colors based on weather CONDITIONS (not temperature) for added dynamism
  generateGeometricOverlay() {
    const elements = [];
    const { ottawa, tokyo } = this.weatherData;
    const avgWind = (ottawa.windSpeed + tokyo.windSpeed) / 2;
    
    // Get weather conditions
    const ottawaCondition = this.getWeatherCondition(ottawa.description);
    const tokyoCondition = this.getWeatherCondition(tokyo.description);
    
    // Determine wind tier and base element count
    // Increased counts so overall overlay is denser, especially at higher winds
    let baseElements, tier;
    if (avgWind >= 30) {
      tier = 'TYPHOON'; // 30-50 m/s
      baseElements = 120;
    } else if (avgWind >= 20) {
      tier = 'STORM'; // 20-30 m/s
      baseElements = 90;
    } else if (avgWind >= 15) {
      tier = 'STRONG'; // 15-20 m/s
      baseElements = 70;
    } else if (avgWind >= 10) {
      tier = 'MODERATE'; // 10-15 m/s
      baseElements = 56;
    } else if (avgWind >= 5) {
      tier = 'LIGHT'; // 5-10 m/s
      baseElements = 40;
    } else {
      tier = 'CALM'; // 0-5 m/s
      baseElements = 30;
    }
    
    // Base geometric elements (lines and rectangles)
    for (let i = 0; i < baseElements; i++) {
      const x = this.random(0, this.SCRN_W);
      const y = this.random(0, this.SCRN_H);
      const type = Math.floor(this.random(0, 2)); // 0=line, 1=rect
      
      // Alternate between Ottawa and Tokyo conditions for variety
      const useAlternate = this.random() > 0.5;
      const condition = useAlternate ? tokyoCondition : ottawaCondition;
      
      if (type === 0) {
        // Line - length increases with wind speed
        const baseLength = this.map(avgWind, 0, 50, 50, 300);
        const length = this.random(baseLength * 0.7, baseLength * 1.3);
        const angle = this.random(0, Math.PI * 2);
        const x2 = x + Math.cos(angle) * length;
        const y2 = y + Math.sin(angle) * length;
        const opacity = this.random(0.1, 0.3);
        const strokeWidth = this.map(avgWind, 0, 50, 1, 4);
        const color = this.getConditionColor(condition, useAlternate);
        elements.push(`  <line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
      } else {
        // Rectangle - size and rotation vary with wind
        const baseSize = this.map(avgWind, 0, 50, 20, 100);
        const w = this.random(baseSize * 0.8, baseSize * 1.2);
        const h = this.random(baseSize * 0.8, baseSize * 1.2);
        const rotation = this.random(0, 360);
        const opacity = this.random(0.05, 0.15);
        const color = this.getConditionColor(condition, useAlternate);
        elements.push(`  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${x} ${y})"/>`);
      }
    }
    
    // Add tier-specific elements for higher wind speeds
    if (tier === 'STRONG' || tier === 'STORM' || tier === 'TYPHOON') {
      // Add diagonal line patterns (wind streaks)
      const numStreaks = Math.floor(this.map(avgWind, 15, 50, 18, 40));
      for (let i = 0; i < numStreaks; i++) {
        const x = this.random(0, this.SCRN_W);
        const y = this.random(0, this.SCRN_H);
        const length = this.random(100, 400);
        // Diagonal angles (wind direction)
        const angle = this.random(Math.PI / 6, Math.PI / 3) + (this.random() > 0.5 ? Math.PI : 0);
        const x2 = x + Math.cos(angle) * length;
        const y2 = y + Math.sin(angle) * length;
        const opacity = this.random(0.05, 0.15);
        const strokeWidth = this.random(1, 2);
        const condition = this.random() > 0.5 ? tokyoCondition : ottawaCondition;
        const color = this.getConditionColor(condition, this.random() > 0.5);
        elements.push(`  <line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
      }
    }
    
    if (tier === 'STORM' || tier === 'TYPHOON') {
      // Add smaller fragmented rectangles (debris/chaos effect)
      const numFragments = Math.floor(this.map(avgWind, 20, 50, 15, 40));
      for (let i = 0; i < numFragments; i++) {
        const x = this.random(0, this.SCRN_W);
        const y = this.random(0, this.SCRN_H);
        const w = this.random(5, 25);
        const h = this.random(5, 25);
        const rotation = this.random(0, 360);
        const opacity = this.random(0.1, 0.25);
        const condition = this.random() > 0.5 ? tokyoCondition : ottawaCondition;
        const color = this.getConditionColor(condition, this.random() > 0.5);
        elements.push(`  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${x} ${y})"/>`);
      }
    }
    
    if (tier === 'TYPHOON') {
      // Add long sweeping lines (extreme wind patterns)
      const numSweeps = Math.floor(this.random(14, 24));
      for (let i = 0; i < numSweeps; i++) {
        const x = this.random(-100, this.SCRN_W + 100);
        const y = this.random(-100, this.SCRN_H + 100);
        const length = this.random(300, 600);
        const angle = this.random(0, Math.PI * 2);
        const x2 = x + Math.cos(angle) * length;
        const y2 = y + Math.sin(angle) * length;
        const opacity = this.random(0.08, 0.2);
        const strokeWidth = this.random(2, 5);
        const condition = this.random() > 0.5 ? tokyoCondition : ottawaCondition;
        const color = this.getConditionColor(condition, this.random() > 0.5);
        elements.push(`  <line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
      }
      
      // Add overlapping rectangles (layered chaos)
      const numLayers = Math.floor(this.random(10, 20));
      for (let i = 0; i < numLayers; i++) {
        const x = this.random(0, this.SCRN_W);
        const y = this.random(0, this.SCRN_H);
        const w = this.random(30, 120);
        const h = this.random(30, 120);
        const rotation = this.random(0, 360);
        const opacity = this.random(0.03, 0.1);
        const condition = this.random() > 0.5 ? tokyoCondition : ottawaCondition;
        const color = this.getConditionColor(condition, this.random() > 0.5);
        elements.push(`  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${x} ${y})"/>`);
      }
    }
    
    return elements;
  }
  
  // Option 3: Gradient Mesh Overlay (very fast)
  // Creates a few large gradient rectangles
  // Colors based on weather CONDITIONS
  generateGradientMesh() {
    const elements = [];
    const { ottawa, tokyo } = this.weatherData;
    
    // Get weather conditions
    const ottawaCondition = this.getWeatherCondition(ottawa.description);
    const tokyoCondition = this.getWeatherCondition(tokyo.description);
    
    // Create 3-5 large gradient overlays
    const numGradients = Math.floor(this.random(3, 6));
    
    for (let i = 0; i < numGradients; i++) {
      const x = this.random(-100, this.SCRN_W);
      const y = this.random(-100, this.SCRN_H);
      const w = this.random(200, 400);
      const h = this.random(200, 400);
      
      // Alternate between conditions for variety
      const useAlternate = this.random() > 0.5;
      const condition = useAlternate ? tokyoCondition : ottawaCondition;
      
      const color1 = this.getConditionColor(condition, false);
      const color2 = this.getConditionColor(condition, true);
      const opacity = this.random(0.05, 0.15);
      
      const gradientId = 'mesh-gradient-' + i + '-' + Math.random().toString(36).substr(2, 5);
      const gradientDef = `
    <radialGradient id="${gradientId}">
      <stop offset="0%" stop-color="${color1}" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="${color2}" stop-opacity="0"/>
    </radialGradient>`;
      
      elements.push({
        def: gradientDef,
        element: `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${gradientId})"/>`
      });
    }
    
    return elements;
  }
  
  // Option 4: Simple Dot Pattern (fastest)
  // Just sparse dots with varying sizes
  // Colors based on weather CONDITIONS
  generateDotPattern() {
    const elements = [];
    const { ottawa, tokyo } = this.weatherData;
    const avgHumidity = (ottawa.humidity + tokyo.humidity) / 2;
    
    // Get weather conditions
    const ottawaCondition = this.getWeatherCondition(ottawa.description);
    const tokyoCondition = this.getWeatherCondition(tokyo.description);
    
    // Number of dots based on humidity
    const numDots = Math.floor(this.map(avgHumidity, 0, 100, 30, 100));
    
    for (let i = 0; i < numDots; i++) {
      const x = this.random(0, this.SCRN_W);
      const y = this.random(0, this.SCRN_H);
      const size = this.random(2, 8);
      const opacity = this.random(0.1, 0.3);
      
      // Alternate between conditions for variety
      const useAlternate = this.random() > 0.5;
      const condition = useAlternate ? tokyoCondition : ottawaCondition;
      const color = this.getConditionColor(condition, useAlternate);
      
      elements.push(`  <circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="${opacity}"/>`);
    }
    
    return elements;
  }
  
  // Get weather condition from description
  // Handles OpenWeather API descriptions like "overcast clouds", "broken clouds", "few clouds", etc.
  getWeatherCondition(description) {
    const desc = description.toLowerCase();
    
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
  
  // Get color palette based on weather condition (separate from temperature system)
  getConditionColor(condition, alternate = false) {
    const palettes = {
      'CLEAR': {
        primary: ['#FFD700', '#FFE135', '#ADFF2F', '#9ACD32', '#7CFC00'], // Greens and yellows
        secondary: ['#FFA500', '#FF8C00', '#32CD32', '#00FF00', '#90EE90']
      },
      'CLOUDY': {
        primary: ['#D3D3D3', '#C0C0C0', '#A9A9A9', '#808080', '#696969'], // Grays
        secondary: ['#F5F5F5', '#E0E0E0', '#DCDCDC', '#B0B0B0', '#778899']
      },
      'RAIN': {
        primary: ['#4682B4', '#5F9EA0', '#20B2AA', '#00CED1', '#48D1CC'], // Blues and cyans
        secondary: ['#1E90FF', '#00BFFF', '#87CEEB', '#B0E0E6', '#ADD8E6']
      },
      'SNOW': {
        primary: ['#E6E6FA', '#F0F8FF', '#F8F8FF', '#FFFFFF', '#E0E0E0'], // Icy whites and light blues
        secondary: ['#B0C4DE', '#C0C0C0', '#D3D3D3', '#DCDCDC', '#E6E6FA']
      },
      'FOG': {
        primary: ['#C0C0C0', '#D3D3D3', '#DCDCDC', '#E0E0E0', '#F5F5F5'], // Muted grays
        secondary: ['#A9A9A9', '#808080', '#778899', '#708090', '#B0C4DE']
      },
      'STORM': {
        primary: ['#2F4F4F', '#36454F', '#708090', '#778899', '#191970'], // Dark grays and deep blues
        secondary: ['#000080', '#000033', '#1C1C1C', '#2F2F2F', '#404040']
      },
      'WINDY': {
        primary: ['#E8E8E8', '#F0F0F0', '#F5F5F5', '#FAFAFA', '#FFFFFF'], // Light grays and whites
        secondary: ['#D3D3D3', '#DCDCDC', '#E0E0E0', '#F8F8FF', '#F0F8FF']
      },
      'PARTLY_CLOUDY': {
        primary: ['#87CEEB', '#B0E0E6', '#E0F6FF', '#F0F8FF', '#E6E6FA'], // Light blues and whites
        secondary: ['#4682B4', '#5F9EA0', '#ADD8E6', '#D3D3D3', '#F5F5F5']
      }
    };
    
    const palette = palettes[condition] || palettes['PARTLY_CLOUDY'];
    const colors = alternate ? palette.secondary : palette.primary;
    const randomIndex = Math.floor(this.random(0, colors.length));
    return colors[randomIndex];
  }
  
  // Get color based on weather conditions (Ottawa and Tokyo)
  getWeatherColor(avgTemp, alternate = false) {
    // This method is kept for backward compatibility but now uses condition-based colors
    const { ottawa, tokyo } = this.weatherData;
    
    // Determine primary condition (use the more dominant one, or combine)
    const ottawaCondition = this.getWeatherCondition(ottawa.description);
    const tokyoCondition = this.getWeatherCondition(tokyo.description);
    
    // Use the condition that appears first, or combine if different
    let primaryCondition = ottawaCondition;
    if (ottawaCondition === tokyoCondition) {
      primaryCondition = ottawaCondition;
    } else {
      // If different, prefer clear/partly cloudy over others, or use Ottawa's
      if (tokyoCondition === 'CLEAR' || tokyoCondition === 'PARTLY_CLOUDY') {
        primaryCondition = tokyoCondition;
      } else {
        primaryCondition = ottawaCondition;
      }
    }
    
    return this.getConditionColor(primaryCondition, alternate);
  }
  
  // Helper: Map value from one range to another
  map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }
}

module.exports = AbstractLayer;

