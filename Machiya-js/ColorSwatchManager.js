// ColorSwatchManager.js
// Manages color swatch combinations based on weather data
// Ported from Processing with weather-based element selection

const ColorSwatch = require('./ColorSwatch');

class ColorSwatchManager {
  constructor(hatchMode, weatherData, randomFn) {
    this.hatchMode = hatchMode;
    this.weatherData = weatherData;
    this.random = randomFn;
    
    this.hatchElements = ["FIRE", "WATER", "EARTH", "WIND", "WOOD", "METAL", "HOLOGRAM"];
    this.element = null;
    this.cHatchSwatch = [];
    
    if (hatchMode) {
      this.initHatching();
    }
  }
  
  // Select element based on temperature
  selectElementFromTemp(temp) {
    if (temp >= 35) {
      return "FIRE";
    } else if (temp >= 25) {
      return "HOT";
    } else if (temp >= 15) {
      return "WARM";
    } else if (temp >= 10) {
      return "COOL";
    } else if (temp >= 0) {
      return "COLD";
    } else if (temp >= -10) {
      return "FREEZING";
    } else if (temp >= -15) {
      return "FROSTBITE";
    } else if (temp >= -25) {
      return "SUPERFROSTBITE";
    } else if (temp >= -35) {
      return "EXTREMEFREEZE";
    } else {
      return "ABSOLUTEFREEZE";
    }
  }
  
  // Select element based on weather data with granular temperature mapping
  selectElementFromWeather() {
    const { ottawa, tokyo } = this.weatherData;
    const ottawaTemp = ottawa.temperature;
    const tokyoTemp = tokyo.temperature;
    
    // Get element for each city
    const ottawaElement = this.selectElementFromTemp(ottawaTemp);
    const tokyoElement = this.selectElementFromTemp(tokyoTemp);
    
    // If both cities have the same element, use it directly
    if (ottawaElement === tokyoElement) {
      return ottawaElement;
    }
    
    // Otherwise, we'll interpolate between the two
    // Store both for interpolation
    this.ottawaElement = ottawaElement;
    this.tokyoElement = tokyoElement;
    
    // For now, return the average-based element as fallback
    // The interpolation will happen in buildElementColorData
    const avgTemp = (ottawaTemp + tokyoTemp) / 2;
    return this.selectElementFromTemp(avgTemp);
  }
  
  initHatching() {
    // Select element based on weather instead of random
    const { ottawa, tokyo } = this.weatherData;
    const ottawaTemp = ottawa.temperature;
    const tokyoTemp = tokyo.temperature;
    
    console.log(`Temperature check: Ottawa=${ottawaTemp}°C, Tokyo=${tokyoTemp}°C`);
    
    this.element = this.selectElementFromWeather();
    
    const ottawaElement = this.selectElementFromTemp(ottawaTemp);
    const tokyoElement = this.selectElementFromTemp(tokyoTemp);
    
    console.log(`Ottawa (${ottawaTemp}°C) → ${ottawaElement}`);
    console.log(`Tokyo (${tokyoTemp}°C) → ${tokyoElement}`);
    console.log(`Selected element: ${this.element}`);
    if (this.ottawaElement && this.tokyoElement) {
      console.log(`Will interpolate: ${this.ottawaElement} ↔ ${this.tokyoElement}`);
    }
    
    // Build color data sets for the selected element
    this.buildElementColorData(this.element);
  }
  
  // Interpolate between two RGB colors
  interpolateColor(color1, color2, t) {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t)
    };
  }
  
  // Interpolate between two color palettes
  interpolatePalettes(palette1, palette2, t, targetSize) {
    const interpolated = [];
    const minLength = Math.min(palette1.length, palette2.length);
    
    for (let i = 0; i < targetSize; i++) {
      const index1 = Math.floor((i / targetSize) * palette1.length);
      const index2 = Math.floor((i / targetSize) * palette2.length);
      const color1 = palette1[Math.min(index1, palette1.length - 1)];
      const color2 = palette2[Math.min(index2, palette2.length - 1)];
      interpolated.push(this.interpolateColor(color1, color2, t));
    }
    
    return interpolated;
  }
  
  buildElementColorData(element) {
    // Simplified color palettes for each element
    // In full version, these would be the full color arrays from Processing code
    
    const colorSets = {
      "FIRE": [
        // Extreme heat - intense reds, deep oranges, bright yellows (> 35°C)
        ["#FF0000", "#FF4500", "#FF6347", "#FF6B00", "#FF8C00", "#FFA500", "#FFD700", "#FFFF00"],
        ["#DC143C", "#FF1493", "#FF4500", "#FF6347", "#FF7F50", "#FF8C00", "#FFA500", "#FFB347"],
        ["#8B0000", "#A52A2A", "#B22222", "#DC143C", "#FF0000", "#FF4500", "#FF6347", "#FF7F50"],
        ["#FF4500", "#FF6347", "#FF7F50", "#FF8C00", "#FFA500", "#FFD700", "#FFFF00", "#FFE135"]
      ],
      "HOT": [
        // Hot temperatures (25-35°C) - bright oranges, warm yellows, coral
        ["#FF8C00", "#FFA500", "#FFB347", "#FFD700", "#FFE135", "#FFF44F", "#FFE4B5", "#FFDAB9"],
        ["#FF7F50", "#FF6347", "#FF8C00", "#FFA500", "#FFB347", "#FFD700", "#FFE135", "#FFF44F"],
        ["#FF6B35", "#F7931E", "#FFD23F", "#FF6B00", "#FF8C00", "#FFA500", "#FFB347", "#FFD700"],
        ["#FFA500", "#FFB347", "#FFD700", "#FFE135", "#FFF44F", "#FFE4B5", "#FFDAB9", "#FFEFD5"]
      ],
      "WARM": [
        // Warm temperatures (15-25°C) - soft oranges, peaches, light yellows
        ["#FFD700", "#FFE135", "#FFF44F", "#FFE4B5", "#FFDAB9", "#FFEFD5", "#FFF8DC", "#F5DEB3"],
        ["#FFB347", "#FFD700", "#FFE135", "#FFF44F", "#FFE4B5", "#FFDAB9", "#FFEFD5", "#FFF8DC"],
        ["#FFA500", "#FFB347", "#FFD700", "#FFE135", "#FFF44F", "#FFE4B5", "#FFDAB9", "#FFEFD5"],
        ["#FFE4B5", "#FFDAB9", "#FFEFD5", "#FFF8DC", "#F5DEB3", "#DEB887", "#D2B48C", "#BC8F8F"]
      ],
      "COOL": [
        // Cool temperatures (10-15°C) - light blues, soft cyans, pale greens
        ["#87CEEB", "#B0E0E6", "#ADD8E6", "#E0F6FF", "#F0F8FF", "#F5FFFA", "#E6E6FA", "#E0E0FF"],
        ["#4682B4", "#5F9EA0", "#87CEEB", "#B0E0E6", "#ADD8E6", "#E0F6FF", "#F0F8FF", "#F5FFFA"],
        ["#1E90FF", "#00BFFF", "#87CEEB", "#B0E0E6", "#ADD8E6", "#E0F6FF", "#F0F8FF", "#E6E6FA"],
        ["#B0E0E6", "#ADD8E6", "#E0F6FF", "#F0F8FF", "#F5FFFA", "#E6E6FA", "#E0E0FF", "#F8F8FF"]
      ],
      "COLD": [
        // Cold temperatures (0-10°C) - medium blues, teals, cool grays
        ["#4682B4", "#5F9EA0", "#20B2AA", "#00CED1", "#48D1CC", "#40E0D0", "#7B68EE", "#9370DB"],
        ["#1E90FF", "#00BFFF", "#87CEEB", "#4682B4", "#5F9EA0", "#20B2AA", "#00CED1", "#48D1CC"],
        ["#0000CD", "#191970", "#000080", "#4169E1", "#6495ED", "#7B68EE", "#9370DB", "#8A2BE2"],
        ["#708090", "#778899", "#B0C4DE", "#C0C0C0", "#D3D3D3", "#DCDCDC", "#E0E0E0", "#F5F5F5"]
      ],
      "FREEZING": [
        // Freezing temperatures (0 to -10°C) - deep blues, icy cyans, cool whites
        ["#0000CD", "#191970", "#000080", "#4169E1", "#6495ED", "#7B68EE", "#9370DB", "#8A2BE2"],
        ["#00FFFF", "#00CED1", "#48D1CC", "#40E0D0", "#00FA9A", "#00FF7F", "#3CB371", "#2E8B57"],
        ["#1E3A8A", "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#EFF6FF"],
        ["#B0C4DE", "#C0C0C0", "#D3D3D3", "#DCDCDC", "#E0E0E0", "#F5F5F5", "#F8F8FF", "#FFFFFF"]
      ],
      "FROSTBITE": [
        // Frostbite temperatures (-10 to -15°C) - darker blues, deeper cyans, frosty whites
        ["#000080", "#191970", "#000033", "#000066", "#000099", "#0000CC", "#0000FF", "#1E3A8A"],
        ["#008B8B", "#00CED1", "#48D1CC", "#20B2AA", "#008080", "#00FFFF", "#40E0D0", "#00CED1"],
        ["#1E3A8A", "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#EFF6FF"],
        ["#708090", "#778899", "#B0C4DE", "#C0C0C0", "#D3D3D3", "#DCDCDC", "#E0E0E0", "#F5F5F5"]
      ],
      "SUPERFROSTBITE": [
        // Super Frostbite temperatures (-15 to -25°C) - very dark blues, deep purples, icy grays
        ["#000033", "#000066", "#000099", "#0000CC", "#000080", "#191970", "#0000FF", "#1E3A8A"],
        ["#4B0082", "#6A0DAD", "#8B008B", "#9400D3", "#9932CC", "#BA55D3", "#DA70D6", "#DDA0DD"],
        ["#2F4F4F", "#36454F", "#708090", "#778899", "#B0C4DE", "#C0C0C0", "#D3D3D3", "#DCDCDC"],
        ["#1C1C1C", "#2F2F2F", "#404040", "#525252", "#696969", "#808080", "#A9A9A9", "#C0C0C0"]
      ],
      "EXTREMEFREEZE": [
        // Extreme Freeze temperatures (-25 to -35°C) - darkest blues, deep purples, near-black
        ["#000011", "#000022", "#000033", "#000044", "#000055", "#000066", "#000077", "#000088"],
        ["#2E0854", "#4B0082", "#6A0DAD", "#8B008B", "#9400D3", "#9932CC", "#BA55D3", "#DA70D6"],
        ["#1A1A2E", "#16213E", "#0F3460", "#533483", "#2F4F4F", "#36454F", "#708090", "#778899"],
        ["#000000", "#0A0A0A", "#141414", "#1E1E1E", "#282828", "#323232", "#3C3C3C", "#464646"]
      ],
      "ABSOLUTEFREEZE": [
        // Absolute Freeze temperatures (-35°C and under) - black, deepest purples, void-like
        ["#000000", "#000011", "#000022", "#000033", "#000044", "#000055", "#000066", "#000077"],
        ["#1A0033", "#2E0854", "#4B0082", "#6A0DAD", "#8B008B", "#9400D3", "#9932CC", "#BA55D3"],
        ["#000000", "#0A0A0A", "#141414", "#1A1A2E", "#16213E", "#0F3460", "#533483", "#2F4F4F"],
        ["#000000", "#050505", "#0A0A0A", "#0F0F0F", "#141414", "#191919", "#1E1E1E", "#232323"]
      ],
      "WATER": [
        // Cool blues, cyans, teals
        ["#1E90FF", "#00BFFF", "#87CEEB", "#4682B4", "#5F9EA0", "#20B2AA", "#00CED1", "#48D1CC"],
        ["#0000CD", "#191970", "#000080", "#4169E1", "#6495ED", "#7B68EE", "#9370DB", "#8A2BE2"],
        ["#00FFFF", "#00CED1", "#48D1CC", "#40E0D0", "#00FA9A", "#00FF7F", "#3CB371", "#2E8B57"],
        ["#1E3A8A", "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#EFF6FF"]
      ],
      "EARTH": [
        // Browns, greens, tans
        ["#8B4513", "#A0522D", "#CD853F", "#D2691E", "#DEB887", "#F4A460", "#D2B48C", "#BC8F8F"],
        ["#228B22", "#32CD32", "#3CB371", "#66CDAA", "#90EE90", "#98FB98", "#ADFF2F", "#9ACD32"],
        ["#556B2F", "#6B8E23", "#808000", "#9ACD32", "#ADFF2F", "#7CFC00", "#7FFF00", "#00FF00"],
        ["#654321", "#8B4513", "#A0522D", "#CD853F", "#D2691E", "#DEB887", "#F4A460", "#D2B48C"]
      ],
      "WIND": [
        // Light grays, whites, silvers
        ["#C0C0C0", "#D3D3D3", "#DCDCDC", "#F5F5F5", "#FFFFFF", "#F8F8FF", "#F0F8FF", "#E6E6FA"],
        ["#A9A9A9", "#808080", "#696969", "#778899", "#708090", "#B0C4DE", "#D3D3D3", "#E0E0E0"],
        ["#2F4F4F", "#708090", "#778899", "#B0C4DE", "#C0C0C0", "#D3D3D3", "#DCDCDC", "#F5F5F5"],
        ["#E8E8E8", "#F0F0F0", "#F5F5F5", "#FAFAFA", "#FFFFFF", "#F8F8FF", "#F0F8FF", "#E6E6FA"]
      ],
      "WOOD": [
        // Wood tones, browns, ambers
        ["#8B4513", "#A0522D", "#CD853F", "#D2691E", "#DA70D6", "#DDA0DD", "#EE82EE", "#FF69B4"],
        ["#654321", "#8B4513", "#A0522D", "#CD853F", "#D2691E", "#DEB887", "#F4A460", "#D2B48C"],
        ["#4B0082", "#8B008B", "#9400D3", "#9932CC", "#BA55D3", "#DA70D6", "#DDA0DD", "#EE82EE"],
        ["#8B4513", "#A0522D", "#CD853F", "#D2691E", "#DEB887", "#F4A460", "#D2B48C", "#BC8F8F"]
      ],
      "METAL": [
        // Metallic grays, silvers, golds
        ["#C0C0C0", "#A9A9A9", "#808080", "#696969", "#778899", "#708090", "#B0C4DE", "#D3D3D3"],
        ["#FFD700", "#FFA500", "#FF8C00", "#FF7F50", "#FF6347", "#FF4500", "#FF1493", "#DC143C"],
        ["#2F4F4F", "#708090", "#778899", "#B0C4DE", "#C0C0C0", "#D3D3D3", "#DCDCDC", "#F5F5F5"],
        ["#E8E8E8", "#F0F0F0", "#F5F5F5", "#FAFAFA", "#FFFFFF", "#F8F8FF", "#F0F8FF", "#E6E6FA"]
      ],
      "HOLOGRAM": [
        // Rainbow, prismatic colors
        ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3", "#FF1493"],
        ["#FF69B4", "#FF1493", "#DC143C", "#FF4500", "#FF8C00", "#FFD700", "#ADFF2F", "#00FF7F"],
        ["#00FFFF", "#00CED1", "#1E90FF", "#0000FF", "#4B0082", "#9400D3", "#FF1493", "#FF69B4"],
        ["#FFD700", "#FFA500", "#FF8C00", "#FF7F50", "#FF6347", "#FF4500", "#FF1493", "#DC143C"]
      ]
    };
    
    // Fallback to COOL if element not found (shouldn't happen, but safety check)
    // Check if we need to interpolate between Ottawa and Tokyo palettes
    if (this.ottawaElement && this.tokyoElement && this.ottawaElement !== this.tokyoElement) {
      // Interpolate between the two cities' palettes
      const ottawaColors = colorSets[this.ottawaElement] || colorSets["COOL"];
      const tokyoColors = colorSets[this.tokyoElement] || colorSets["COOL"];
      
      // Calculate interpolation factor based on temperature difference
      const { ottawa, tokyo } = this.weatherData;
      const ottawaTemp = ottawa.temperature;
      const tokyoTemp = tokyo.temperature;
      const avgTemp = (ottawaTemp + tokyoTemp) / 2;
      const tempRange = Math.abs(ottawaTemp - tokyoTemp);
      
      // Interpolation factor: 0 = all Ottawa, 1 = all Tokyo
      // Calculate based on how close the average is to each city's temperature
      // If average is closer to Ottawa, t is closer to 0; if closer to Tokyo, t is closer to 1
      let t = 0.5; // Default to 50/50
      if (tempRange > 0) {
        // Distance from average to each city
        const distToOttawa = Math.abs(avgTemp - ottawaTemp);
        const distToTokyo = Math.abs(avgTemp - tokyoTemp);
        const totalDist = distToOttawa + distToTokyo;
        
        if (totalDist > 0) {
          // Weight by inverse distance: closer city gets more weight
          t = distToOttawa / totalDist; // More distance to Ottawa = more Tokyo influence
        }
      }
      
      console.log(`Interpolating between ${this.ottawaElement} (Ottawa: ${ottawaTemp}°C) and ${this.tokyoElement} (Tokyo: ${tokyoTemp}°C)`);
      console.log(`  Average temp: ${avgTemp.toFixed(2)}°C, Range: ${tempRange.toFixed(2)}°C`);
      console.log(`  Interpolation factor: ${t.toFixed(2)} (0=Ottawa, 1=Tokyo, 0.5=equal)`);
      
      // Create interpolated color swatches
      this.cHatchSwatch = [];
      const numSwatches = Math.min(ottawaColors.length, tokyoColors.length);
      
      for (let i = 0; i < numSwatches; i++) {
        // Expand each palette first
        const ottawaExpanded = this.expandColorPalette(ottawaColors[i], 256);
        const tokyoExpanded = this.expandColorPalette(tokyoColors[i], 256);
        
        // Interpolate between the expanded palettes
        const interpolatedPalette = this.interpolatePalettes(ottawaExpanded, tokyoExpanded, t, 256);
        this.cHatchSwatch.push(new ColorSwatch(interpolatedPalette));
      }
    } else {
      // Use single element palette (both cities same or no interpolation needed)
      const elementColors = colorSets[element] || colorSets["COOL"];
      
      // Create ColorSwatch objects for each color set
      this.cHatchSwatch = [];
      for (let i = 0; i < elementColors.length; i++) {
        // Expand the color array to 256 colors by interpolating
        const expandedPalette = this.expandColorPalette(elementColors[i], 256);
        this.cHatchSwatch.push(new ColorSwatch(expandedPalette));
      }
    }
  }
  
  // Expand a small color palette to 256 colors by interpolation
  expandColorPalette(baseColors, targetSize) {
    const palette = [];
    const steps = targetSize / baseColors.length;
    
    for (let i = 0; i < baseColors.length; i++) {
      const currentColor = this.hexToRgb(baseColors[i]);
      const nextColor = this.hexToRgb(baseColors[(i + 1) % baseColors.length]);
      
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const r = Math.round(currentColor.r + (nextColor.r - currentColor.r) * t);
        const g = Math.round(currentColor.g + (nextColor.g - currentColor.g) * t);
        const b = Math.round(currentColor.b + (nextColor.b - currentColor.b) * t);
        palette.push({ r, g, b });
      }
    }
    
    // Trim to exact target size
    return palette.slice(0, targetSize);
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  getRandomColorSwatch() {
    if (this.hatchMode && this.cHatchSwatch.length > 0) {
      const index = Math.floor(this.random(0, this.cHatchSwatch.length));
      return this.cHatchSwatch[index];
    }
    return this.cHatchSwatch[0] || new ColorSwatch([{ r: 128, g: 128, b: 128 }]);
  }
  
  getElement() {
    return this.element;
  }
}

module.exports = ColorSwatchManager;

