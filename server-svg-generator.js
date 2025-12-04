// SVG Generator for Weather Art
// Recreates the artwork as SVG using the same algorithms as artwork.js

class SVGArtGenerator {
  constructor(weatherData, seed, colorVariations) {
    this.weatherData = weatherData;
    this.seed = seed;
    this.colorVariations = colorVariations;
    this.fullWidth = 1080;
    this.fullHeight = 1350;
    this.svgElements = [];
    
    // Initialize random state (p5.js LCG algorithm)
    this.randomSeed(seed);
  }

  // p5.js exact LCG algorithm: (seed * 1103515245 + 12345) & 0x7fffffff
  random(min = 0, max = 1) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    // p5.js LCG
    this.randomState = (this.randomState * 1103515245 + 12345) & 0x7fffffff;
    const rnd = this.randomState / 0x7fffffff;
    return min + rnd * (max - min);
  }

  randomSeed(seed) {
    // p5.js converts to integer, ensures not 0, then masks to 31 bits
    let s = Math.floor(seed);
    if (s === 0) s = 1;
    this.randomState = s & 0x7fffffff;
    
    // Initialize Perlin noise permutation table
    this.initPerlinNoise();
  }
  
  // Initialize Perlin noise permutation table (seeded)
  initPerlinNoise() {
    // Create permutation array [0..255]
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    
    // Shuffle using seeded random
    const savedState = this.randomState;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    
    // Duplicate the permutation array
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i];
    }
    
    this.randomState = savedState; // Restore random state
  }
  
  // Fade function for smooth interpolation
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // Linear interpolation
  lerp(a, b, t) {
    return a + t * (b - a);
  }
  
  // Gradient function - generates a random gradient vector
  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : 0);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  // 2D Perlin noise function
  noise(x, y) {
    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    // Get relative x,y coordinates of point within that cell
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // Compute fade curves for each of x,y
    const u = this.fade(x);
    const v = this.fade(y);
    
    // Hash coordinates of the 4 square corners
    const A = this.p[X] + Y;
    const AA = this.p[A];
    const AB = this.p[A + 1];
    const B = this.p[X + 1] + Y;
    const BA = this.p[B];
    const BB = this.p[B + 1];
    
    // And add blended results from 4 corners of the square
    return this.lerp(
      this.lerp(this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y), u),
      this.lerp(this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1), u),
      v
    ) * 0.5 + 0.5; // Normalize to 0-1 range
  }

  // Convert RGB to hex
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // Add SVG element
  addElement(element) {
    this.svgElements.push(element);
  }

  // Generate background
  generateBackground() {
    // Clamp colorVariations.background to ensure reasonable values
    const bgVariation = Math.max(0.5, Math.min(1.5, this.colorVariations.background || 1.0));
    
    // Calculate RGB values and clamp to valid range (0-255)
    const bgR = Math.max(0, Math.min(255, Math.floor(240 * bgVariation)));
    const bgG = Math.max(0, Math.min(255, Math.floor(245 * bgVariation)));
    const bgB = Math.max(0, Math.min(255, Math.floor(250 * bgVariation)));
    
    const bgColor = this.rgbToHex(bgR, bgG, bgB);
    console.log('SVG Background color:', { bgVariation, bgR, bgG, bgB, bgColor });
    
    return `<rect x="0" y="0" width="${this.fullWidth}" height="${this.fullHeight}" fill="${bgColor}"/>`;
  }

  // Draw ellipse
  ellipse(x, y, w, h, fill = null, stroke = null, strokeWidth = 0, opacity = 1) {
    const cx = x;
    const cy = y;
    const rx = w / 2;
    const ry = h / 2;
    let attrs = `cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"`;
    if (fill) attrs += ` fill="${fill}"`;
    if (stroke) attrs += ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
    if (opacity < 1) attrs += ` opacity="${opacity}"`;
    return `<ellipse ${attrs}/>`;
  }

  // Draw rectangle
  rect(x, y, w, h, fill = null, stroke = null, strokeWidth = 0, opacity = 1) {
    let attrs = `x="${x}" y="${y}" width="${w}" height="${h}"`;
    if (fill) attrs += ` fill="${fill}"`;
    if (stroke) attrs += ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
    if (opacity < 1) attrs += ` opacity="${opacity}"`;
    return `<rect ${attrs}/>`;
  }

  // Draw line
  line(x1, y1, x2, y2, stroke = null, strokeWidth = 1, opacity = 1) {
    let attrs = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`;
    if (stroke) attrs += ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
    if (opacity < 1) attrs += ` opacity="${opacity}"`;
    return `<line ${attrs}/>`;
  }

  // Draw path (for curves)
  path(d, fill = null, stroke = null, strokeWidth = 0, opacity = 1) {
    let attrs = `d="${d}"`;
    if (fill && fill !== 'none') attrs += ` fill="${fill}"`;
    else attrs += ` fill="none"`;
    if (stroke) attrs += ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
    if (opacity < 1) attrs += ` opacity="${opacity}"`;
    return `<path ${attrs}/>`;
  }

  // Generate the complete SVG
  generate() {
    this.randomSeed(this.seed);
    
    // CRITICAL: Consume the first 3 random numbers to match canvas version
    // (These generate colorVariations in the canvas version, but we use the provided ones)
    const bgVariationRandom = this.random(0.9, 1.1);
    const satVariation = this.random(0.8, 1.2);
    const brightVariation = this.random(0.9, 1.1);
    // Now the random sequence is aligned with the canvas version

    // Calculate background color for SVG element attribute (fallback)
    // Use the provided colorVariations.background, clamped to safe range
    const bgVariation = Math.max(0.5, Math.min(1.5, this.colorVariations.background || 1.0));
    const bgR = Math.max(0, Math.min(255, Math.floor(240 * bgVariation)));
    const bgG = Math.max(0, Math.min(255, Math.floor(245 * bgVariation)));
    const bgB = Math.max(0, Math.min(255, Math.floor(250 * bgVariation)));
    const bgColorHex = this.rgbToHex(bgR, bgG, bgB);
    
    // Set background color on SVG element itself to prevent black backgrounds during rendering
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.fullWidth}" height="${this.fullHeight}" viewBox="0 0 ${this.fullWidth} ${this.fullHeight}" style="background-color: ${bgColorHex};">\n`;
    
    // Background MUST be first element (using provided colorVariations, not the ones we just generated)
    // This ensures the background is always rendered, even if other elements fail
    svg += this.generateBackground() + '\n';

    const { ottawa, tokyo } = this.weatherData;

    // Generate all artwork elements (random sequence now matches canvas)
    this.drawWeatherPatterns(ottawa, tokyo);
    this.drawTemperatureCurves(ottawa, tokyo);
    this.drawHumidityEffects(ottawa, tokyo);
    this.drawWindPatterns(ottawa, tokyo);
    this.drawUniqueElements(ottawa, tokyo);
    this.drawPerlinNoisePatterns(ottawa, tokyo); // Add Perlin noise patterns

    // Add all elements
    svg += this.svgElements.join('\n');
    
    svg += '\n</svg>';
    return svg;
  }

  // Drawing functions (mirroring artwork.js)
  drawWeatherPatterns(ottawa, tokyo) {
    const ottawaColor = this.getWeatherColor(ottawa.description);
    const tokyoColor = this.getWeatherColor(tokyo.description);
    
    // Ottawa side (left half)
    this.drawCityPattern(ottawa, ottawaColor, 0, 0, this.fullWidth/2, this.fullHeight);
    
    // Tokyo side (right half)
    this.drawCityPattern(tokyo, tokyoColor, this.fullWidth/2, 0, this.fullWidth/2, this.fullHeight);
  }

  drawCityPattern(weather, color, x, y, w, h) {
    const fillColor = this.rgbToHex(color[0], color[1], color[2]);
    const numShapes = Math.floor(weather.humidity / 10) + 5;
    
    for (let i = 0; i < numShapes; i++) {
      const shapeX = this.random(x, x + w);
      const shapeY = this.random(y, y + h);
      const size = this.random(20, 80) * (weather.pressure / 1000);
      
      if (weather.description.includes('cloud')) {
        this.drawCloudShape(shapeX, shapeY, size, fillColor);
      } else if (weather.description.includes('rain')) {
        this.drawRainShape(shapeX, shapeY, size, fillColor);
      } else if (weather.description.includes('sun')) {
        this.drawSunShape(shapeX, shapeY, size, fillColor);
      } else {
        this.drawAbstractShape(shapeX, shapeY, size, fillColor);
      }
    }
  }

  drawCloudShape(x, y, size, color) {
    const variation = this.random(0.8, 1.2);
    const heightVariation = this.random(0.4, 0.8);
    this.addElement(this.ellipse(x, y, size * variation, size * heightVariation, color));
    this.addElement(this.ellipse(x + size/3 * this.random(0.8, 1.2), y, size * 0.8 * variation, size * 0.5 * heightVariation, color));
    this.addElement(this.ellipse(x - size/3 * this.random(0.8, 1.2), y, size * 0.7 * variation, size * 0.4 * heightVariation, color));
  }

  drawRainShape(x, y, size, color) {
    const rainCount = Math.floor(this.random(3, 8));
    for (let i = 0; i < rainCount; i++) {
      const offsetX = this.random(-2, 2);
      const offsetY = this.random(-2, 2);
      this.addElement(this.line(x + i * 2 + offsetX, y + offsetY, x + i * 2 + offsetX, y + size + offsetY, color, 1));
    }
  }

  drawSunShape(x, y, size, color) {
    const sizeVariation = this.random(0.8, 1.2);
    this.addElement(this.ellipse(x, y, size * sizeVariation, size * sizeVariation, color));
    const rayCount = Math.floor(this.random(6, 12));
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 / rayCount) * i + this.random(-0.2, 0.2);
      const rayLength = this.random(0.8, 1.2);
      const x1 = x + Math.cos(angle) * size/2;
      const y1 = y + Math.sin(angle) * size/2;
      const x2 = x + Math.cos(angle) * size * rayLength;
      const y2 = y + Math.sin(angle) * size * rayLength;
      this.addElement(this.line(x1, y1, x2, y2, color, 2));
    }
  }

  drawAbstractShape(x, y, size, color) {
    let pathData = 'M ';
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const radius = this.random(size/3, size/2);
      const vertexX = x + Math.cos(angle) * radius;
      const vertexY = y + Math.sin(angle) * radius;
      pathData += (i === 0 ? '' : ' L ') + `${vertexX},${vertexY}`;
    }
    pathData += ' Z';
    this.addElement(this.path(pathData, color));
  }

  drawTemperatureCurves(ottawa, tokyo) {
    const strokeColor = this.rgbToHex(255, 100, 100);
    
    // Ottawa temperature curve
    let pathData = 'M ';
    for (let x = 0; x < this.fullWidth/2; x += 10) {
      const temp = ottawa.temperature;
      const y = this.fullHeight/2 + Math.sin(x * 0.02) * temp * 2;
      pathData += (x === 0 ? '' : ' L ') + `${x},${y}`;
    }
    this.addElement(this.path(pathData, 'none', strokeColor, 3, 0.59));
    
    // Tokyo temperature curve
    pathData = 'M ';
    for (let x = this.fullWidth/2; x < this.fullWidth; x += 10) {
      const temp = tokyo.temperature;
      const y = this.fullHeight/2 + Math.sin(x * 0.02) * temp * 2;
      pathData += (x === this.fullWidth/2 ? '' : ' L ') + `${x},${y}`;
    }
    this.addElement(this.path(pathData, 'none', strokeColor, 3, 0.59));
  }

  drawHumidityEffects(ottawa, tokyo) {
    const ottawaOpacity = this.map(ottawa.humidity, 0, 100, 50, 200) / 255;
    const tokyoOpacity = this.map(tokyo.humidity, 0, 100, 50, 200) / 255;
    
    // Ottawa humidity particles
    const ottawaColor = this.rgbToHex(100, 150, 255);
    for (let i = 0; i < ottawa.humidity; i++) {
      const x = this.random(0, this.fullWidth/2);
      const y = this.random(0, this.fullHeight);
      this.addElement(this.ellipse(x, y, 3, 3, ottawaColor, null, 0, ottawaOpacity));
    }
    
    // Tokyo humidity particles
    const tokyoColor = this.rgbToHex(255, 150, 100);
    for (let i = 0; i < tokyo.humidity; i++) {
      const x = this.random(this.fullWidth/2, this.fullWidth);
      const y = this.random(0, this.fullHeight);
      this.addElement(this.ellipse(x, y, 3, 3, tokyoColor, null, 0, tokyoOpacity));
    }
  }

  drawWindPatterns(ottawa, tokyo) {
    const strokeColor = this.rgbToHex(200, 200, 200);
    
    // Ottawa wind
    for (let i = 0; i < ottawa.windSpeed * 5; i++) {
      const x = this.random(0, this.fullWidth/2);
      const y = this.random(0, this.fullHeight);
      const length = ottawa.windSpeed * 10;
      this.addElement(this.line(x, y, x + length, y, strokeColor, 1, 0.39));
    }
    
    // Tokyo wind
    for (let i = 0; i < tokyo.windSpeed * 5; i++) {
      const x = this.random(this.fullWidth/2, this.fullWidth);
      const y = this.random(0, this.fullHeight);
      const length = tokyo.windSpeed * 10;
      this.addElement(this.line(x, y, x + length, y, strokeColor, 1, 0.39));
    }
  }

  drawUniqueElements(ottawa, tokyo) {
    // Unique geometric patterns
    const patternCount = Math.floor(this.random(3, 8));
    for (let i = 0; i < patternCount; i++) {
      const x = this.random(0, this.fullWidth);
      const y = this.random(0, this.fullHeight);
      const size = this.random(20, 80);
      const alpha = this.random(30, 80) / 255;
      const r = this.random(100, 255);
      const g = this.random(100, 255);
      const b = this.random(100, 255);
      const color = this.rgbToHex(r, g, b);
      
      if (this.random() > 0.5) {
        this.addElement(this.ellipse(x, y, size, size * this.random(0.5, 1.5), color, null, 0, alpha));
      } else {
        this.addElement(this.rect(x - size/2, y - size/2, size, size * this.random(0.5, 1.5), color, null, 0, alpha));
      }
    }
    
    // Unique connecting lines
    const lineCount = Math.floor(this.random(5, 15));
    for (let i = 0; i < lineCount; i++) {
      const x1 = this.random(0, this.fullWidth);
      const y1 = this.random(0, this.fullHeight);
      const x2 = this.random(0, this.fullWidth);
      const y2 = this.random(0, this.fullHeight);
      const r = this.random(150, 255);
      const g = this.random(150, 255);
      const b = this.random(150, 255);
      const alpha = this.random(40, 100) / 255;
      const strokeWidth = this.random(1, 3);
      const color = this.rgbToHex(r, g, b);
      this.addElement(this.line(x1, y1, x2, y2, color, strokeWidth, alpha));
    }
    
    // Unique textural elements
    const textureCount = Math.floor(this.random(10, 25));
    for (let i = 0; i < textureCount; i++) {
      const x = this.random(0, this.fullWidth);
      const y = this.random(0, this.fullHeight);
      const size = this.random(2, 8);
      const r = this.random(200, 255);
      const g = this.random(200, 255);
      const b = this.random(200, 255);
      const alpha = this.random(20, 60) / 255;
      const color = this.rgbToHex(r, g, b);
      this.addElement(this.ellipse(x, y, size, size, color, null, 0, alpha));
    }
  }

  getWeatherColor(description) {
    const colors = {
      'clear': [255, 215, 0],
      'sun': [255, 165, 0],
      'cloud': [169, 169, 169],
      'rain': [70, 130, 180],
      'snow': [255, 250, 250],
      'storm': [105, 105, 105],
      'mist': [192, 192, 192],
      'fog': [211, 211, 211]
    };
    
    for (const [key, color] of Object.entries(colors)) {
      if (description.toLowerCase().includes(key)) {
        return color;
      }
    }
    
    return [100, 150, 200];
  }

  map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }
  
  // Draw Perlin noise-based patterns for organic, natural-looking effects
  drawPerlinNoisePatterns(ottawa, tokyo) {
    // Use Perlin noise to create organic cloud-like patterns
    const noiseScale = 0.01; // Scale factor for noise coordinates
    const cloudiness = (ottawa.humidity + tokyo.humidity) / 2;
    const numClouds = Math.floor(this.map(cloudiness, 0, 100, 5, 25));
    
    // Generate cloud-like blobs using Perlin noise
    for (let i = 0; i < numClouds; i++) {
      // Use random to get starting position, then use noise for organic shape
      const baseX = this.random(0, this.fullWidth);
      const baseY = this.random(0, this.fullHeight * 0.6); // Clouds in upper portion
      
      // Use Perlin noise to create organic cloud shapes
      const noiseX = baseX * noiseScale;
      const noiseY = baseY * noiseScale;
      const noiseValue = this.noise(noiseX, noiseY);
      
      // Cloud position influenced by noise
      const cloudX = baseX + (noiseValue - 0.5) * 100;
      const cloudY = baseY + this.noise(noiseX + 100, noiseY + 100) * 50;
      
      // Cloud size based on noise and weather
      const sizeBase = this.map(cloudiness, 0, 100, 40, 150);
      const sizeVariation = this.noise(noiseX * 2, noiseY * 2);
      const cloudSize = sizeBase * (0.7 + sizeVariation * 0.6);
      
      // Cloud opacity based on noise
      const opacity = this.map(this.noise(noiseX * 3, noiseY * 3), 0, 1, 0.1, 0.3);
      
      // Cloud color - light gray/white
      const cloudColor = this.rgbToHex(200, 210, 220);
      
      // Draw cloud as ellipse with noise-based variation
      const widthVariation = this.noise(noiseX * 1.5, noiseY * 1.5);
      this.addElement(this.ellipse(
        cloudX, 
        cloudY, 
        cloudSize * (0.8 + widthVariation * 0.4), 
        cloudSize * 0.6, 
        cloudColor, 
        null, 
        0, 
        opacity
      ));
    }
    
    // Use Perlin noise for organic flow fields (wind patterns)
    const windStrength = (ottawa.windSpeed + tokyo.windSpeed) / 2;
    if (windStrength > 2) {
      const numFlowLines = Math.floor(this.map(windStrength, 0, 10, 0, 30));
      
      for (let i = 0; i < numFlowLines; i++) {
        const startX = this.random(0, this.fullWidth);
        const startY = this.random(0, this.fullHeight);
        
        // Use Perlin noise to determine flow direction
        const noiseX = startX * noiseScale;
        const noiseY = startY * noiseScale;
        const angle = this.noise(noiseX, noiseY) * Math.PI * 2;
        const length = windStrength * 15;
        
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;
        
        const lineOpacity = this.map(this.noise(noiseX * 2, noiseY * 2), 0, 1, 0.2, 0.5);
        const lineColor = this.rgbToHex(180, 180, 200);
        
        this.addElement(this.line(startX, startY, endX, endY, lineColor, 1, lineOpacity));
      }
    }
    
    // Use Perlin noise for organic texture overlay
    const textureIntensity = this.map((ottawa.humidity + tokyo.humidity) / 2, 0, 100, 0, 1);
    if (textureIntensity > 0.3) {
      const numTexturePoints = Math.floor(textureIntensity * 100);
      
      for (let i = 0; i < numTexturePoints; i++) {
        const x = this.random(0, this.fullWidth);
        const y = this.random(0, this.fullHeight);
        
        // Use noise to determine texture point intensity
        const noiseValue = this.noise(x * noiseScale * 5, y * noiseScale * 5);
        if (noiseValue > 0.4) { // Only draw if noise value is above threshold
          const pointSize = this.map(noiseValue, 0.4, 1, 1, 3);
          const pointOpacity = this.map(noiseValue, 0.4, 1, 0.1, 0.3);
          const pointColor = this.rgbToHex(150, 160, 180);
          
          this.addElement(this.ellipse(x, y, pointSize, pointSize, pointColor, null, 0, pointOpacity));
        }
      }
    }
  }
}

module.exports = SVGArtGenerator;

