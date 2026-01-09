// VOSlatPanel.js
// Value Object for individual slat panel
// Ported from Processing

const ValueObject = require('./ValueObject');

class VOSlatPanel extends ValueObject {
  constructor(id, x, y, w, h, color) {
    super();
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = color; // {r, g, b} object
  }
  
  addToSVG(svgElements) {
    const colorHex = this.rgbToHex(this.c.r, this.c.g, this.c.b);
    svgElements.push(`<rect x="${this.x}" y="${this.y}" width="${this.w}" height="${this.h}" fill="${colorHex}" />`);
  }
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

module.exports = VOSlatPanel;



