// Server-side Machiya Generator
// Generates Machiya-style artwork based on weather data
// Similar to server-svg-generator.js but uses Machiya visual style

const MachiyaGenerator = require('./Machiya-js/MachiyaGenerator');

class ServerMachiyaGenerator {
  constructor(weatherData, seed, colorVariations) {
    this.weatherData = weatherData;
    this.seed = seed;
    this.colorVariations = colorVariations;
    this.fullWidth = 1080;
    this.fullHeight = 1350;
  }
  
  generate() {
    // Create Machiya generator with weather data
    const machiyaGen = new MachiyaGenerator(
      this.weatherData,
      this.seed,
      this.fullWidth,
      this.fullHeight
    );
    
    // Generate SVG
    const svgContent = machiyaGen.generate();
    
    return svgContent;
  }
}

module.exports = ServerMachiyaGenerator;


