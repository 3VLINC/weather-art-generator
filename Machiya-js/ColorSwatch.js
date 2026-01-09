// ColorSwatch.js
// Holds a palette of colors
// Ported from Processing

class ColorSwatch {
  constructor(palette) {
    this.palette = palette; // Array of {r, g, b} objects
  }
  
  getNumberOfPalette() {
    return this.palette.length;
  }
  
  getColor(index) {
    if (index >= 0 && index < this.palette.length) {
      return this.palette[index];
    }
    return { r: 128, g: 128, b: 128 }; // Default gray
  }
  
  // Convert RGB to hex string for SVG
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  
  getHexColor(index) {
    const color = this.getColor(index);
    return this.rgbToHex(color.r, color.g, color.b);
  }
}

module.exports = ColorSwatch;



