// SlatPanelGroup.js
// Holds individual SlatPanels to form a grid structure
// Ported from Processing (simplified version)

const VOSlatPanel = require('./VOSlatPanel');
const VOSlatShoji = require('./VOSlatShoji');

class SlatPanelGroup {
  constructor(id, colors, randomFn, screenW, screenH) {
    this.id = id;
    this.colors = colors;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    // Constrain starting position to ensure panels fit within canvas
    this.x = Math.floor(this.random(0, this.SCRN_W / 2));
    // Shift shoji grids lower - start from 1/6 of screen height instead of top
    this.y = Math.floor(this.random(this.SCRN_H / 6, this.SCRN_H / 2)); // Start lower on canvas
    this.c = colors[Math.floor(this.random(0, colors.length))];
    
    // Original, thinner shoji slats
    this.slatWidth = Math.floor(this.random(1, 3));
    // Constrain slatHeight to ensure it doesn't exceed canvas bounds
    // Increased max height - can now go up to 3/4 of screen height
    //const maxHeight = this.SCRN_H - this.y - 50; // Leave 50px margin at bottom
    const maxHeight = this.SCRN_H*2;
    this.slatHeight = Math.floor(this.random(this.SCRN_H / 4, Math.min(this.SCRN_H * 0.75, maxHeight)));
    this.gridspaceX = Math.floor(this.random(2, 10));
    
    // Allow number of slats to overflow canvas; clipping will be handled at SVG level
    this.COL_SLATS = Math.floor(this.random(5, 60));
    this.ROW_SLATS = Math.floor(this.random(5, 15)); // Reduced max rows
    
    this.slatPanelsX = [];
    this.slatPanelsY = [];
    
    this.createSlatPanels();
    this.createShoji();
  }
  
  createSlatPanels() {
    let currentX = this.x;
    
    // Create horizontal slats (can overflow canvas; will be clipped by SVG clipPath)
    for (let i = 0; i < this.COL_SLATS; i++) {
      this.slatPanelsX.push(new VOSlatPanel(i, currentX, this.y, this.slatWidth, this.slatHeight, this.c));
      currentX += this.gridspaceX + this.slatWidth;
    }
    
    // Recalculate width based on actual panels created
    if (this.slatPanelsX.length > 0) {
      this.w = currentX - this.gridspaceX - this.slatPanelsX[0].x;
    } else {
      this.w = 0;
      return; // No panels created, exit early
    }
    
    // Create vertical slats (can overflow canvas; will be clipped by SVG clipPath)
    const gridspaceY = this.slatHeight / this.ROW_SLATS;
    let currentY = this.y;
    
    for (let j = 0; j <= this.ROW_SLATS; j++) {
      this.slatPanelsY.push(new VOSlatPanel(j, this.slatPanelsX[0].x, currentY, this.w, this.slatWidth, this.c));
      currentY += gridspaceY;
    }
    
    // Recalculate height based on actual panels created
    if (this.slatPanelsY.length > 0) {
      this.h = this.slatPanelsY[this.slatPanelsY.length - 1].y - this.slatPanelsY[0].y + this.slatWidth;
    } else {
      this.h = 0;
    }
  }
  
  createShoji() {
    const x = this.slatPanelsY[0].x;
    const y = this.slatPanelsY[0].y;
    const colorIndex = Math.floor(this.random(0, this.colors.length));
    this.slatShoji = new VOSlatShoji(x, y, this.w, this.h, this.colors[colorIndex]);
  }
  
  addToSVG(svgElements) {
    // Calculate center point for rotation
    const centerX = this.slatPanelsX.length > 0 ? this.slatPanelsX[0].x + this.w / 2 : this.x + this.w / 2;
    const centerY = this.slatPanelsY.length > 0 ? this.slatPanelsY[0].y + this.h / 2 : this.y + this.h / 2;
    
    // Rotate 45 degrees around center
    const rotationAngle = 30;
    
    // Collect all elements first (they don't have indentation)
    const groupElements = [];
    
    // Render shoji first (bottom layer)
    if (this.slatShoji) {
      this.slatShoji.addToSVG(groupElements);
    }
    
    // Render horizontal slats
    for (let i = 0; i < this.slatPanelsX.length; i++) {
      this.slatPanelsX[i].addToSVG(groupElements);
    }
    
    // Render vertical slats
    for (let j = 0; j < this.slatPanelsY.length; j++) {
      this.slatPanelsY[j].addToSVG(groupElements);
    }
    
    // Wrap all elements in a group with rotation transform
    svgElements.push(`  <g transform="rotate(${rotationAngle} ${centerX} ${centerY})">`);
    // Add all group elements with proper indentation (they come without indentation)
    groupElements.forEach(el => {
      svgElements.push(`    ${el}`);
    });
    svgElements.push(`  </g>`);
  }
}

module.exports = SlatPanelGroup;


