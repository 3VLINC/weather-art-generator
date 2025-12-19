// VOStarLight.js
// Value Object for Star Light
// Ported from Processing

const ValueObject = require('./ValueObject');

class VOStarLight extends ValueObject {
  constructor(x, y, size, color, randomFn) {
    super();
    this.x = x;
    this.y = y;
    this.sz = size;
    this.c = color; // {r, g, b} object
    this.o = Math.floor(randomFn(0, 255)); // opacity
    this.random = randomFn;
  }
  
  addToSVG(svgElements) {
    const colorHex = this.rgbToHex(this.c.r, this.c.g, this.c.b);
    const opacity = this.o / 255;
    svgElements.push(`<circle cx="${this.x}" cy="${this.y}" r="${this.sz/2}" fill="${colorHex}" opacity="${opacity}" />`);
  }
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

module.exports = VOStarLight;


