// VOMoon.js
// Value Object for Moon/Sun
// Ported from Processing

const ValueObject = require('./ValueObject');

class VOMoon extends ValueObject {
  constructor(moonMode, moonSize, moonX, moonY, moonFill, isDay, randomFn) {
    super();
    this.MOON_MODE = moonMode; // 0=solid, 1=glow
    this.MOON_SIZE = moonSize;
    this.x = moonX;
    this.y = moonY;
    this.c = moonFill;
    this.isDay = isDay;
    this.random = randomFn;
  }
  
  addToSVG(svgElements) {
    const colorHex = this.rgbToHex(this.c.r, this.c.g, this.c.b);
    // Always draw a glowing moon using layered circles, matching original Processing sketch
    // color moonGlow = color(c, 25);
    // fill(moonGlow);
    // for (int i=0; i<15; i++) {
    //   ellipse(x, y, MOON_SIZE+i*(i/4), MOON_SIZE+i*(i/4));
    // }
    const glowOpacity = 25 / 255; // alpha 25
    for (let i = 0; i < 15; i++) {
      const glowSize = this.MOON_SIZE + i * (i / 4);
      svgElements.push(
        `<circle cx="${this.x}" cy="${this.y}" r="${glowSize/2}" fill="${colorHex}" opacity="${glowOpacity}" />`
      );
    }
    // Main core circle on top
    svgElements.push(`<circle cx="${this.x}" cy="${this.y}" r="${this.MOON_SIZE/2}" fill="${colorHex}" />`);
  }
  
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

module.exports = VOMoon;


