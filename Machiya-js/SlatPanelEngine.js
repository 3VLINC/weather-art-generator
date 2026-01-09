// SlatPanelEngine.js
// Creates and manages SlatPanelGroups
// Ported from Processing with weather-based density

const SlatPanelGroup = require('./SlatPanelGroup');

class SlatPanelEngine {
  constructor(colors, weatherData, randomFn, screenW, screenH) {
    this.colors = colors;
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    this.MAX_PANEL_GROUPS = 50;
    this.slatPnlGrp = [];
    
    this.init();
  }
  
  init() {
    const { ottawa, tokyo } = this.weatherData;
    const avgHumidity = (ottawa.humidity + tokyo.humidity) / 2;
    const avgWind = (ottawa.windSpeed + tokyo.windSpeed) / 2;
    
    // More panels on windy days (more movement/activity)
    // Fewer panels on calm days
    // Supports up to 50 m/s (typhoon conditions)
    let numGroups;
    if (avgWind > 30) {
      // Typhoon/hurricane conditions - maximum density
      numGroups = Math.floor(this.random(40, this.MAX_PANEL_GROUPS));
    } else if (avgWind > 15) {
      // Strong wind/storm conditions
      numGroups = Math.floor(this.random(30, this.MAX_PANEL_GROUPS));
    } else if (avgWind > 5) {
      // Moderate wind
      numGroups = Math.floor(this.random(20, this.MAX_PANEL_GROUPS));
    } else if (avgWind > 2) {
      // Light wind
      numGroups = Math.floor(this.random(10, 30));
    } else {
      // Calm conditions
      numGroups = Math.floor(this.random(5, 15));
    }
    
    for (let i = 0; i < numGroups; i++) {
      this.slatPnlGrp.push(new SlatPanelGroup(i, this.colors, this.random, this.SCRN_W, this.SCRN_H));
    }
    
    console.log(`Weather-based slat panels initialized: ${numGroups} groups`);
  }
  
  addToSVG(svgElements) {
    for (let i = 0; i < this.slatPnlGrp.length; i++) {
      this.slatPnlGrp[i].addToSVG(svgElements);
    }
  }
  
  // Get all groups with their Y positions for depth sorting
  getGroupsWithDepth() {
    return this.slatPnlGrp.map(group => ({
      group: group,
      y: group.y, // Y position of the group
      type: 'shoji'
    }));
  }
}

module.exports = SlatPanelEngine;


