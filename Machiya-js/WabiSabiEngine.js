// WabiSabiEngine.js
// Core rendering engine for Machiya-style artwork
// Ported from Processing with weather data integration

const VOMoon = require('./VOMoon');
const VOStarLight = require('./VOStarLight');
const SlatPanelEngine = require('./SlatPanelEngine');
const CloudGenerator = require('./CloudGenerator');
const SnowflakeGenerator = require('./SnowflakeGenerator');
const RainGenerator = require('./RainGenerator');
const SakuraBranchGenerator = require('./SakuraBranchGenerator');

class WabiSabiEngine {
  constructor(colors, weatherData, randomFn, screenW = 1080, screenH = 1350) {
    this.colors = colors; // Color palette array
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SEED = 0;
    
    // Canvas dimensions
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    // SVG elements arrays
    this.svgElements = [];
    this.defsElements = [];
    
    this.init(colors);
  }
  
  init(colors) {
    this.colors = colors;
    
    // Initialize components based on weather
    this.initStarlight();
    this.initMoon();
    this.initCloudGenerator();
    this.initSnowflakeGenerator();
    this.initRainGenerator();
    this.initSlatPanelEngine(colors);
    //this.initSakuraBranchGenerator();
    
    // Initialize gradient background colors based on weather
    this.initGradientBackground();
    
    // Initialize wabi-sabi textures
    this.initWabiSabiTextures();
  }
  
  // Initialize stars based on weather conditions
  initStarlight() {
    const { ottawa, tokyo } = this.weatherData;
    const avgTemp = (ottawa.temperature + tokyo.temperature) / 2;
    const avgHumidity = (ottawa.humidity + tokyo.humidity) / 2;
    
    // More stars on clear, cold nights; fewer on cloudy/humid days
    const maxStars = 2500; // Reduced max for better performance
    let numStars;
    
    if (avgTemp < 5 && avgHumidity < 50) {
      // Clear, cold night = many stars
      numStars = Math.floor(this.random(700, maxStars));
    } else if (avgHumidity > 70) {
      // High humidity = cloudy = fewer stars
      numStars = Math.floor(this.random(500, 1000));
    } else {
      // default
      numStars = Math.floor(this.random(100, maxStars));
    }
    
    this.stars = [];
    for (let i = 0; i < numStars; i++) {
      // Ensure stars stay within canvas bounds
      const x = this.random(0, this.SCRN_W);
      const y = this.random(0, this.SCRN_H);
      const size = this.random(1, 3);


      //const colorIndex = Math.floor(this.random(0, this.colors.length));
      //const color = this.colors[colorIndex];
      const color = { r: 255, g: 255, b: 255 };
      
      this.stars.push(new VOStarLight(x, y, size, color, this.random));
    }
    
    console.log(`Weather-based stars initialized: ${numStars} stars`);
  }
  
  // Initialize moon based on weather and time
  initMoon() {
    const { ottawa, tokyo } = this.weatherData;
    const avgTemp = (ottawa.temperature + tokyo.temperature) / 2;
    const timeOfDay = new Date().getHours();
    
    // Determine if it's day (sun) or night (moon)
    const isDay = timeOfDay >= 7 && timeOfDay < 19;
    // At night always use glow mode to emulate original layered glowing moon
    const moonMode = isDay ? 0 : 1; // 0=solid (sun), 1=glow (moon)
    // Make moon slightly larger overall
    const size = this.random(250, 500);
    // Constrain position to ensure moon stays within canvas
    const x = this.random(size/2 + 50, Math.max(size/2 + 50, this.SCRN_W - size/2 - 50));
    const y = this.random(size, Math.min(this.SCRN_H/3, this.SCRN_H - size/2 - 50)); // Keep in upper third
    
    // Moon has its own color palette: whites, light blues, to yellows
    const moonPalette = [
      // Whites
      { r: 255, g: 255, b: 255 }, // Pure white
      { r: 255, g: 250, b: 250 }, // Snow white
      { r: 248, g: 248, b: 255 }, // Ghost white
      { r: 245, g: 245, b: 250 }, // White smoke
      { r: 240, g: 248, b: 255 }, // Alice blue
      { r: 230, g: 230, b: 250 }, // Lavender blush
      // Light blues
      { r: 176, g: 224, b: 230 }, // Powder blue
      { r: 173, g: 216, b: 230 }, // Light blue
      { r: 135, g: 206, b: 250 }, // Light sky blue
      { r: 135, g: 206, b: 235 }, // Sky blue
      { r: 176, g: 196, b: 222 }, // Light steel blue
      { r: 175, g: 238, b: 238 }, // Pale turquoise
      { r: 224, g: 255, b: 255 }, // Light cyan
      { r: 240, g: 255, b: 255 }, // Azure
      { r: 230, g: 230, b: 250 }, // Lavender
      { r: 221, g: 160, b: 221 }, // Plum
      // Yellows
      { r: 255, g: 255, b: 224 }, // Light yellow
      { r: 255, g: 250, b: 205 }, // Lemon chiffon
      { r: 255, g: 239, b: 213 }, // Papaya whip
      { r: 255, g: 228, b: 196 }, // Bisque
      { r: 255, g: 218, b: 185 }, // Peach puff
      { r: 255, g: 222, b: 173 }, // Navajo white
      { r: 250, g: 250, b: 210 }, // Beige
      { r: 255, g: 245, b: 238 }, // Seashell
      { r: 255, g: 250, b: 240 }, // Floral white
      { r: 255, g: 255, b: 240 }, // Ivory
      // Creamy yellows
      { r: 255, g: 253, b: 208 }, // Light goldenrod yellow
      { r: 250, g: 250, b: 210 }, // Light yellow-green
      { r: 255, g: 248, b: 220 }, // Cornsilk
      { r: 255, g: 239, b: 213 }, // Antique white
      { r: 255, g: 228, b: 181 }, // Moccasin
    ];
    
    // Randomly select a color from the moon palette
    const colorIndex = Math.floor(this.random(0, moonPalette.length));
    const color = moonPalette[colorIndex];
    
    console.log(`Moon color selected: RGB(${color.r}, ${color.g}, ${color.b}) from moon palette`);
    
    this.moon = new VOMoon(moonMode, size, x, y, color, isDay, this.random);
  }
  
  initCloudGenerator() {
    this.cloudGenerator = new CloudGenerator(this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initSnowflakeGenerator() {
    this.snowflakeGenerator = new SnowflakeGenerator(this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initRainGenerator() {
    this.rainGenerator = new RainGenerator(this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initSakuraBranchGenerator() {
    this.sakuraBranchGenerator = new SakuraBranchGenerator(this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initSlatPanelEngine(colors) {
    this.spEngine = new SlatPanelEngine(colors, this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initGradientBackground() {
    const { ottawa, tokyo } = this.weatherData;
    
    // Get current UTC time
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcTime = utcHours + utcMinutes / 60;
    
    // Calculate local time for each city
    // Ottawa: Eastern Time (EST/EDT) - UTC-5 or UTC-4 (simplified: assume UTC-5 for now)
    // Tokyo: Japan Standard Time (JST) - UTC+9
    const ottawaOffset = -5; // EST (could be -4 for EDT, but simplified)
    const tokyoOffset = 9; // JST
    
    const ottawaHours = (utcTime + ottawaOffset + 24) % 24;
    const tokyoHours = (utcTime + tokyoOffset + 24) % 24;
    
    // Helper function to get time period (returns 0-3 for different periods)
    const getTimePeriod = (hours) => {
      if (hours >= 5 && hours < 7) return 0; // Dawn
      if (hours >= 7 && hours < 17) return 1; // Day
      if (hours >= 17 && hours < 19) return 2; // Twilight
      return 3; // Evening/Night
    };
    
    const ottawaPeriod = getTimePeriod(ottawaHours);
    const tokyoPeriod = getTimePeriod(tokyoHours);
    
    // Select color indices from temperature-based palette based on time of day
    // Different time periods use different ranges of the palette
    const getColorIndexForPeriod = (period, paletteLength) => {
      let startIndex, endIndex;
      
      switch (period) {
        case 0: // Dawn - use warmer, brighter colors (upper 60% of palette)
          startIndex = Math.floor(paletteLength * 0.4);
          endIndex = paletteLength - 1;
          break;
        case 1: // Day - use middle to upper range (middle 60% of palette)
          startIndex = Math.floor(paletteLength * 0.2);
          endIndex = Math.floor(paletteLength * 0.8);
          break;
        case 2: // Twilight - use middle range (middle 50% of palette)
          startIndex = Math.floor(paletteLength * 0.25);
          endIndex = Math.floor(paletteLength * 0.75);
          break;
        case 3: // Evening/Night - use darker colors (lower 60% of palette)
          startIndex = 0;
          endIndex = Math.floor(paletteLength * 0.6);
          break;
        default:
          startIndex = 0;
          endIndex = paletteLength - 1;
      }
      
      return Math.floor(this.random(startIndex, endIndex + 1));
    };
    
    // Get color indices for each city based on their local time
    const ottawaColor1Index = getColorIndexForPeriod(ottawaPeriod, this.colors.length);
    const ottawaColor2Index = getColorIndexForPeriod(ottawaPeriod, this.colors.length);
    const tokyoColor1Index = getColorIndexForPeriod(tokyoPeriod, this.colors.length);
    const tokyoColor2Index = getColorIndexForPeriod(tokyoPeriod, this.colors.length);
    
    // Blend the colors from both cities (50/50 blend)
    const blendColors = (color1, color2) => {
      return {
        r: Math.round((color1.r + color2.r) / 2),
        g: Math.round((color1.g + color2.g) / 2),
        b: Math.round((color1.b + color2.b) / 2)
      };
    };
    
    // Blend Ottawa and Tokyo colors for gradient
    this.GRAD_BG_1 = blendColors(
      this.colors[ottawaColor1Index],
      this.colors[tokyoColor1Index]
    );
    this.GRAD_BG_2 = blendColors(
      this.colors[ottawaColor2Index],
      this.colors[tokyoColor2Index]
    );
  }
  
  initWabiSabiTextures() {
    // Initialize abstract layer generator (lightweight alternative to Perlin noise)
    const AbstractLayer = require('./AbstractLayer');
    this.abstractLayer = new AbstractLayer(this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
    
    // Choose abstract layer style (can be made configurable)
    // Options: 'geometric', 'gradient-mesh', 'dot-pattern', 'turbulence'
    this.abstractLayerStyle = 'geometric'; // Default: geometric overlay
  }
  
  // Generate lightweight abstract overlay
  generateAbstractOverlay() {
    if (!this.abstractLayer) return { defs: [], elements: [] };
    
    const defs = [];
    const elements = [];
    
    switch (this.abstractLayerStyle) {
      case 'geometric':
        // Sparse geometric shapes (circles, lines, rectangles)
        const geometricElements = this.abstractLayer.generateGeometricOverlay();
        elements.push(...geometricElements);
        break;
        
      case 'gradient-mesh':
        // Large gradient mesh overlays
        const gradientMesh = this.abstractLayer.generateGradientMesh();
        gradientMesh.forEach(item => {
          if (item.def) defs.push(item.def);
          elements.push(item.element);
        });
        break;
        
      case 'dot-pattern':
        // Simple dot pattern
        const dots = this.abstractLayer.generateDotPattern();
        elements.push(...dots);
        break;
        
      case 'turbulence':
        // SVG filter turbulence (GPU-accelerated)
        const turbulence = this.abstractLayer.generateTurbulenceFilter();
        defs.push(turbulence.def);
        elements.push(turbulence.element);
        break;
    }
    
    return { defs, elements };
  }
  
  // Generate wabi-sabi texture using Perlin noise (optimized for performance)
  generateWabiSabiTexture() {
    if (!this.perlinNoise) return [];
    
    const textureElements = [];
    const { ottawa, tokyo } = this.weatherData;
    const avgHumidity = (ottawa.humidity + tokyo.humidity) / 2;
    
    // Only generate texture if humidity is significant
    if (avgHumidity < 30) return []; // Skip if too dry
    
    // Optimized: Use larger grid size and sample-based approach
    const gridSize = 20; // Increased from 5 to 20 (16x fewer cells)
    const fidelity = 0.5; // Higher threshold = fewer cells drawn
    const maxCells = 500; // Maximum number of texture cells to generate
    
    let cellCount = 0;
    
    // Sample-based generation instead of full grid
    const sampleRate = Math.floor(this.map(avgHumidity, 30, 100, 200, 800));
    
    for (let s = 0; s < sampleRate && cellCount < maxCells; s++) {
      // Random sampling instead of full grid
      const i = Math.floor(this.random(0, this.SCRN_W / gridSize)) * gridSize;
      const j = Math.floor(this.random(0, this.SCRN_H / gridSize)) * gridSize;
      
      // Get noise value at this position
      const noiseX = i * this.textureScale;
      const noiseY = j * this.textureScale;
      const noiseValue = this.perlinNoise.noise(noiseX, noiseY);
      
      // Only draw if noise value is above threshold (fidelity mode)
      if (noiseValue > fidelity) {
        // Get color from palette based on noise
        const colorIndex = Math.floor(this.map(noiseValue, fidelity, 1, 0, this.colors.length - 1));
        const color = this.colors[Math.min(colorIndex, this.colors.length - 1)];
        
        // Opacity based on noise value
        const opacity = this.map(noiseValue, fidelity, 1, 0.05, 0.15) * this.textureIntensity;
        
        // Create texture rectangle
        const colorHex = this.rgbToHex(
          Math.round(color.r * noiseValue),
          Math.round(color.g * noiseValue),
          Math.round(color.b * noiseValue)
        );
        
        textureElements.push(`  <rect x="${i}" y="${j}" width="${gridSize}" height="${gridSize}" fill="${colorHex}" opacity="${opacity}" />`);
        cellCount++;
      }
    }
    
    return textureElements;
  }
  
  // Map a value from one range to another
  map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }
  
  // Generate SVG content
  generateSVG() {
    this.svgElements = [];
    this.defsElements = [];
    
    // Render gradient background (this will add to defsElements and svgElements)
    this.renderGradient(0, 0, this.SCRN_W, this.SCRN_H, this.GRAD_BG_1, this.GRAD_BG_2, 0);
    
    // Render time-based dark overlay
    this.renderTimeBasedDarkOverlay();
    
    // Render stars
    this.renderStarLight();
    
    // Render moon (behind shoji grids)
    this.renderMoon();
    
    // Render overcast overlay (if overcast conditions detected)
    this.renderOvercastOverlay();
    
    // Render clouds and shoji groups interleaved by depth (Y position)
    this.renderLayeredElements();
    
    // Render rain (on top of other elements for visibility)
    this.renderRain();
    
    // Render abstract overlay (lightweight alternative to Perlin noise)
    const abstractOverlay = this.generateAbstractOverlay();
    this.defsElements = this.defsElements.concat(abstractOverlay.defs);
    this.svgElements = this.svgElements.concat(abstractOverlay.elements);
    
    // Render sakura branches at topmost layer (after everything else)
    this.renderSakuraBranches();
    
    // Build SVG string with proper structure
    // Add clipPath to ensure nothing renders outside bounds
    const clipPathId = 'canvas-clip';
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.SCRN_W}" height="${this.SCRN_H}" viewBox="0 0 ${this.SCRN_W} ${this.SCRN_H}">\n`;
    
    // Add defs first (gradients, clipPath, etc.)
    svg += '  <defs>\n';
    // Add clipPath to constrain all content to canvas bounds
    svg += `    <clipPath id="${clipPathId}">\n`;
    svg += `      <rect x="0" y="0" width="${this.SCRN_W}" height="${this.SCRN_H}" />\n`;
    svg += '    </clipPath>\n';
    
    if (this.defsElements.length > 0) {
      svg += this.defsElements.map(def => '    ' + def).join('\n');
      svg += '\n';
    }
    svg += '  </defs>\n';
    
    // Wrap all elements in a group with clipPath applied
    svg += `  <g clip-path="url(#${clipPathId})">\n`;
    svg += this.svgElements.map(el => '    ' + el).join('\n');
    svg += '\n  </g>\n';
    svg += '</svg>';
    
    return svg;
  }
  
  renderGradient(x, y, w, h, c1, c2, axis) {
    // Create gradient using SVG linearGradient
    const gradientId = 'gradient-' + Math.random().toString(36).substr(2, 9);
    const gradient = axis === 0 
      ? `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">`
      : `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">`;
    
    const c1Hex = this.rgbToHex(c1.r, c1.g, c1.b);
    const c2Hex = this.rgbToHex(c2.r, c2.g, c2.b);
    
    const gradientDef = `${gradient}
        <stop offset="0%" style="stop-color:${c1Hex};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${c2Hex};stop-opacity:1" />
      </linearGradient>`;
    
    this.defsElements.push(gradientDef);
    this.svgElements.push(`  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${gradientId})" />`);
  }
  
  // Calculate dark overlay opacity based on time of day
  // Returns opacity from 0.0 (day) to 1.0 (night)
  getTimeBasedDarkness() {
    const timeOfDay = new Date().getHours();
    const minutes = new Date().getMinutes();
    const timeDecimal = timeOfDay + minutes / 60; // Convert to decimal hours (e.g., 18.5 = 6:30 PM)
    
    // Night: 20:00 (8 PM) to 05:00 (5 AM) - 75-100% opacity
    if (timeDecimal >= 20 || timeDecimal < 5) {
      // Full night: 22:00-04:00 = 100% opacity
      if (timeDecimal >= 22 || timeDecimal < 4) {
        return 1.0;
      }
      // Transition periods: 20:00-22:00 and 04:00-05:00
      if (timeDecimal >= 20) {
        // 20:00-22:00: transition from 0.75 to 1.0
        return 0.75 + ((timeDecimal - 20) / 2) * 0.25;
      } else {
        // 04:00-05:00: transition from 1.0 to 0.75
        return 1.0 - ((timeDecimal - 4) / 1) * 0.25;
      }
    }
    
    // Dawn: 05:00-07:00 - transition from 75% to 0%
    if (timeDecimal >= 5 && timeDecimal < 7) {
      const progress = (timeDecimal - 5) / 2; // 0 to 1
      return 0.75 * (1 - progress);
    }
    
    // Day: 07:00-17:00 - 0% opacity (bright)
    if (timeDecimal >= 7 && timeDecimal < 17) {
      return 0.0;
    }
    
    // Twilight: 17:00-20:00 - transition from 0% to 75%
    if (timeDecimal >= 17 && timeDecimal < 20) {
      const progress = (timeDecimal - 17) / 3; // 0 to 1
      return 0.75 * progress;
    }
    
    return 0.0; // Default fallback
  }
  
  // Render black overlay rectangle with time-based opacity
  renderTimeBasedDarkOverlay() {
    const opacity = this.getTimeBasedDarkness();
    
    // Only render if there's any darkness
    if (opacity > 0) {
      this.svgElements.push(`  <rect x="0" y="0" width="${this.SCRN_W}" height="${this.SCRN_H}" fill="#000000" opacity="${opacity}"/>`);
    }
  }
  
  renderStarLight() {
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].addToSVG(this.svgElements);
    }
  }
  
  renderSlatPanelEngine() {
    if (this.spEngine) {
      this.spEngine.addToSVG(this.svgElements);
    }
  }
  
  renderMoon() {
    if (this.moon) {
      this.moon.addToSVG(this.svgElements);
    }
  }
  
  // Check if overcast conditions are present
  isOvercast() {
    const { ottawa, tokyo } = this.weatherData;
    
    // Check condition ID first (most reliable)
    // ID 804 = overcast clouds (85-100% coverage)
    if (ottawa.id === 804 || tokyo.id === 804) {
      return true;
    }
    
    // Check description for "overcast"
    const ottawaDesc = (ottawa.description || '').toLowerCase();
    const tokyoDesc = (tokyo.description || '').toLowerCase();
    
    if (ottawaDesc.includes('overcast') || tokyoDesc.includes('overcast')) {
      return true;
    }
    
    return false;
  }
  
  // Render overcast overlay - transparent gray rectangle covering entire canvas
  renderOvercastOverlay() {
    if (!this.isOvercast()) {
      return; // Only render if overcast conditions detected
    }
    
    // Varying opacity between 30% to 60%
    const opacity = this.random(0.25, 0.5);
    
    // Gray color for overcast sky
    const grayColor = '#808080'; // Medium gray
    
    // Full canvas rectangle
    this.svgElements.push(`  <rect x="0" y="0" width="${this.SCRN_W}" height="${this.SCRN_H}" fill="${grayColor}" opacity="${opacity}"/>`);
  }
  
  renderClouds() {
    if (this.cloudGenerator) {
      this.cloudGenerator.addToSVG(this.svgElements);
    }
  }
  
  renderRain() {
    if (this.rainGenerator) {
      this.rainGenerator.addToSVG(this.svgElements);
    }
  }
  
  renderSakuraBranches() {
    if (this.sakuraBranchGenerator) {
      this.sakuraBranchGenerator.addToSVG(this.svgElements);
    }
  }
  
    // Render clouds and shoji groups interleaved by depth (Y position)
    renderLayeredElements() {
      // Collect all elements with their Y positions
      const layeredElements = [];
      
      // Get shoji groups with depth info
      if (this.spEngine) {
        const shojiGroups = this.spEngine.getGroupsWithDepth();
        layeredElements.push(...shojiGroups);
      }
      
      // Get clouds with depth info
      if (this.cloudGenerator) {
        const clouds = this.cloudGenerator.getCloudsWithDepth();
        layeredElements.push(...clouds);
      }
      
      // Get snowflakes with depth info
      if (this.snowflakeGenerator) {
        const snowflakes = this.snowflakeGenerator.getSnowflakesWithDepth();
        layeredElements.push(...snowflakes);
      }
    
    // Sort by Y position (top to bottom)
    layeredElements.sort((a, b) => a.y - b.y);
    
    // Render in sorted order (creates natural depth effect)
    for (const element of layeredElements) {
      if (element.type === 'shoji') {
        element.group.addToSVG(this.svgElements);
      } else if (element.type === 'cloud') {
        // Render individual cloud
        const { cloud } = element;
        const { asset, x, y, scaleX, scaleY, rotation, opacity, color } = cloud;
        
        const centerX = x;
        const centerY = y;
        
        let transform = `translate(${centerX}, ${centerY})`;
        if (rotation !== 0) {
          transform += ` rotate(${rotation})`;
        }
        transform += ` scale(${scaleX}, ${scaleY})`;
        transform += ` translate(${-asset.width / 2}, ${-asset.height / 2})`;
        
        this.svgElements.push(`  <g transform="${transform}" opacity="${opacity}">`);
        
        for (const path of asset.paths) {
          this.svgElements.push(`    <path d="${path.d}" fill="${color}"/>`);
        }
        
        this.svgElements.push(`  </g>`);
      } else if (element.type === 'snowflake') {
        // Render individual snowflake
        const { snowflake } = element;
        const { asset, x, y, scaleX, scaleY, rotation, opacity, color } = snowflake;
        
        const centerX = x;
        const centerY = y;
        
        let transform = `translate(${centerX}, ${centerY})`;
        if (rotation !== 0) {
          transform += ` rotate(${rotation})`;
        }
        transform += ` scale(${scaleX}, ${scaleY})`;
        transform += ` translate(${-asset.width / 2}, ${-asset.height / 2})`;
        
        this.svgElements.push(`  <g transform="${transform}" opacity="${opacity}">`);
        
        for (const path of asset.paths) {
          this.svgElements.push(`    <path d="${path.d}" fill="${color}"/>`);
        }
        
        this.svgElements.push(`  </g>`);
      }
    }
  }
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

module.exports = WabiSabiEngine;

