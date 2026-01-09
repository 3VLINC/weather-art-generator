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
    // Brighten the moon color to ensure it's always visible and bright
    // Calculate brightness (luminance) and increase if too dark
    const brightness = (this.c.r * 0.299 + this.c.g * 0.587 + this.c.b * 0.114) / 255;
    let brightR = this.c.r;
    let brightG = this.c.g;
    let brightB = this.c.b;
    
    // If brightness is below 0.5 (50%), brighten the color
    if (brightness < 0.5) {
      // Increase brightness by scaling towards white
      const minBrightness = 0.6; // Target minimum brightness of 60%
      const scale = minBrightness / brightness;
      brightR = Math.min(255, Math.floor(this.c.r * scale));
      brightG = Math.min(255, Math.floor(this.c.g * scale));
      brightB = Math.min(255, Math.floor(this.c.b * scale));
    }
    
    // Ensure minimum RGB values for a bright moon (at least 150 for each channel)
    brightR = Math.max(150, brightR);
    brightG = Math.max(150, brightG);
    brightB = Math.max(150, brightB);
    
    const colorHex = this.rgbToHex(brightR, brightG, brightB);
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


