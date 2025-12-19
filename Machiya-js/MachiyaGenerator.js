// MachiyaGenerator.js
// Main generator class that creates Machiya-style artwork based on weather data
// Ported from Processing Machiya.pde to JavaScript

const WabiSabiEngine = require('./WabiSabiEngine');
const ColorSwatchManager = require('./ColorSwatchManager');

class MachiyaGenerator {
  constructor(weatherData, seed, fullWidth = 1080, fullHeight = 1350) {
    this.weatherData = weatherData;
    this.seed = seed;
    this.fullWidth = fullWidth;
    this.fullHeight = fullHeight;
    
    // Initialize random state with seed
    this.randomState = seed & 0x7fffffff;
    if (this.randomState === 0) this.randomState = 1;
    
    // System-wide settings
    this.NUM_COLORS = 256;
    this.RENDER_MODE = this.determineRenderMode(weatherData);
    
    // Initialize components
    this.initColors();
    this.initWabiSabiEngine();
  }
  
  // p5.js LCG random function
  random(min = 0, max = 1) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    this.randomState = (this.randomState * 1103515245 + 12345) & 0x7fffffff;
    const rnd = this.randomState / 0x7fffffff;
    return min + rnd * (max - min);
  }
  
  // Determine render mode based on weather data
  determineRenderMode(weatherData) {
    const { ottawa, tokyo } = weatherData;
    const avgTemp = (ottawa.temperature + tokyo.temperature) / 2;
    const timeOfDay = new Date().getHours();
    
    // Map time of day and temperature to render modes
    // 0=DAWN, 1=DAY, 2=TWILIGHT, 3=EVENING, 4=METAL, 5=HOLOGRAM
    
    if (timeOfDay >= 5 && timeOfDay < 7) return 0; // DAWN
    if (timeOfDay >= 7 && timeOfDay < 17) return 1; // DAY
    if (timeOfDay >= 17 && timeOfDay < 19) return 2; // TWILIGHT
    if (timeOfDay >= 19 || timeOfDay < 5) return 3; // EVENING
    
    // Rare modes based on weather conditions
    if (avgTemp < -10 && this.random() > 0.95) return 5; // BLUEHOUR (cold)
    if (avgTemp > 25 && this.random() > 0.98) return 4; // GOLDENHOUR (warm)
    
    return 1; // Default to DAY
  }
  
  initColors() {
    // Bind random function to this context
    const randomFn = (min, max) => this.random(min, max);
    
    this.swatchManager = new ColorSwatchManager(true, this.weatherData, randomFn);
    const colorSwatch = this.swatchManager.getRandomColorSwatch();
    
    this.cPalette = [];
    for (let i = 0; i < this.NUM_COLORS; i++) {
      this.cPalette.push(colorSwatch.palette[i]);
    }
  }
  
  initWabiSabiEngine() {
    // Bind random function to this context
    const randomFn = (min, max) => this.random(min, max);
    
    this.wbEngine = new WabiSabiEngine(this.cPalette, this.weatherData, randomFn, this.fullWidth, this.fullHeight);
  }
  
  // Generate SVG content
  generate() {
    // This will be called by the server to generate the SVG
    // The WabiSabiEngine will handle the actual rendering
    if (!this.wbEngine) {
      this.initWabiSabiEngine();
    }
    return this.wbEngine.generateSVG();
  }
  
  getRenderMode() {
    return this.RENDER_MODE;
  }
}

module.exports = MachiyaGenerator;

