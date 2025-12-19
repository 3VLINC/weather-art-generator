// WabiSabiEngine.js
// Core rendering engine for Machiya-style artwork
// Ported from Processing with weather data integration

const VOMoon = require('./VOMoon');
const VOStarLight = require('./VOStarLight');
const SlatPanelEngine = require('./SlatPanelEngine');
const CloudGenerator = require('./CloudGenerator');

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
    this.initSlatPanelEngine(colors);
    
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
    const maxStars = 1000; // Reduced max for better performance
    let numStars;
    
    if (avgTemp < 5 && avgHumidity < 50) {
      // Clear, cold night = many stars
      numStars = Math.floor(this.random(700, maxStars));
    } else if (avgHumidity > 70) {
      // High humidity = cloudy = fewer stars
      numStars = Math.floor(this.random(0, 100));
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
    const size = this.random(150, 450);
    // Constrain position to ensure moon stays within canvas
    const x = this.random(size/2 + 50, Math.max(size/2 + 50, this.SCRN_W - size/2 - 50));
    const y = this.random(size, Math.min(this.SCRN_H/3, this.SCRN_H - size/2 - 50)); // Keep in upper third
    
    const colorIndex = Math.floor(this.random(0, this.colors.length));
    const color = this.colors[colorIndex];
    
    this.moon = new VOMoon(moonMode, size, x, y, color, isDay, this.random);
  }
  
  initCloudGenerator() {
    this.cloudGenerator = new CloudGenerator(this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initSlatPanelEngine(colors) {
    this.spEngine = new SlatPanelEngine(colors, this.weatherData, this.random, this.SCRN_W, this.SCRN_H);
  }
  
  initGradientBackground() {
    const { ottawa, tokyo } = this.weatherData;
    const avgTemp = (ottawa.temperature + tokyo.temperature) / 2;
    const timeOfDay = new Date().getHours();
    
    // Select gradient colors based on temperature and time
    let color1Index, color2Index;
    
    if (timeOfDay >= 5 && timeOfDay < 7) {
      // Dawn - warm colors
      color1Index = Math.floor(this.random(0, this.colors.length));
      color2Index = Math.floor(this.random(0, this.colors.length));
    } else if (timeOfDay >= 7 && timeOfDay < 17) {
      // Day - brighter colors
      color1Index = Math.floor(this.random(0, this.colors.length));
      color2Index = Math.floor(this.random(0, this.colors.length));
    } else if (timeOfDay >= 17 && timeOfDay < 19) {
      // Twilight - cooler colors
      color1Index = Math.floor(this.random(0, this.colors.length));
      color2Index = Math.floor(this.random(0, this.colors.length));
    } else {
      // Evening/Night - darker colors
      color1Index = Math.floor(this.random(0, this.colors.length));
      color2Index = Math.floor(this.random(0, this.colors.length));
    }
    
    this.GRAD_BG_1 = this.colors[color1Index];
    this.GRAD_BG_2 = this.colors[color2Index];
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
    
    // Render clouds and shoji groups interleaved by depth (Y position)
    this.renderLayeredElements();
    
    // Render abstract overlay (lightweight alternative to Perlin noise)
    const abstractOverlay = this.generateAbstractOverlay();
    this.defsElements = this.defsElements.concat(abstractOverlay.defs);
    this.svgElements = this.svgElements.concat(abstractOverlay.elements);
    
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
  
  renderClouds() {
    if (this.cloudGenerator) {
      this.cloudGenerator.addToSVG(this.svgElements);
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

