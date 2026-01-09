// SakuraBranchGenerator.js
// Generates sakura (cherry blossom) branches at the topmost layer
// Positioned on left/right edges, clipped at canvas boundaries

const fs = require('fs');
const path = require('path');

class SakuraBranchGenerator {
  constructor(weatherData, randomFn, screenW = 1080, screenH = 1350) {
    this.weatherData = weatherData;
    this.random = randomFn;
    this.SCRN_W = screenW;
    this.SCRN_H = screenH;
    
    // Load all sakura branch SVG assets
    this.branchAssets = [];
    this.loadBranchAssets();
    
    // Initialize branches
    this.branches = [];
    this.initBranches();
  }
  
  // Load all sakura branch SVG files from svg-assets folder
  loadBranchAssets() {
    const assetsDir = path.join(__dirname, '..', 'svg-assets');
    
    try {
      const files = fs.readdirSync(assetsDir);
      const branchFiles = files.filter(file => 
        file.startsWith('sakurabranch_') && file.endsWith('.svg')
      );
      
      for (const file of branchFiles) {
        const filePath = path.join(assetsDir, file);
        const svgContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract path data from SVG
        const paths = this.extractPathsFromSVG(svgContent);
        if (paths.length > 0) {
          // Extract viewBox for scaling reference
          const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
          const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, 100, 100];
          
          this.branchAssets.push({
            name: file,
            paths: paths,
            viewBox: viewBox,
            width: viewBox[2],
            height: viewBox[3]
          });
        }
      }
      
      console.log(`Loaded ${this.branchAssets.length} sakura branch assets`);
    } catch (error) {
      console.error('Error loading sakura branch assets:', error);
    }
  }
  
  // Extract path elements from SVG content
  extractPathsFromSVG(svgContent) {
    const paths = [];
    const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = pathRegex.exec(svgContent)) !== null) {
      const pathData = match[1];
      // Extract fill color if present
      const fillMatch = svgContent.substring(match.index).match(/fill="([^"]+)"/);
      const fill = fillMatch ? fillMatch[1] : '#000000';
      
      paths.push({
        d: pathData,
        fill: fill
      });
    }
    
    // Also check for other elements like groups, circles, etc.
    const groupRegex = /<g[^>]*>(.*?)<\/g>/gs;
    let groupMatch;
    while ((groupMatch = groupRegex.exec(svgContent)) !== null) {
      const groupContent = groupMatch[1];
      const nestedPaths = this.extractPathsFromSVG(groupContent);
      paths.push(...nestedPaths);
    }
    
    return paths;
  }
  
  // Initialize branches - randomly positioned on left/right edges
  initBranches() {
    if (this.branchAssets.length === 0) {
      console.log('No sakura branch assets available');
      return;
    }
    
    // Randomly decide how many branches to place (1-3 branches)
    const numBranches = Math.floor(this.random(1, 4));
    
    for (let i = 0; i < numBranches; i++) {
      // Randomly select a branch asset
      const assetIndex = Math.floor(this.random(0, this.branchAssets.length));
      const asset = this.branchAssets[assetIndex];
      
      // Decide which edge (left or right)
      const isLeft = this.random() > 0.5;
      
      // Position on edge - branches stick out from left or right edge
      // For left edge: x at or near 0, branch extends inward
      // For right edge: x at or near SCRN_W, branch extends inward
      const edgeOffset = 50; // Small offset to allow branch to extend slightly beyond edge
      const x = isLeft 
        ? this.random(-edgeOffset, edgeOffset) // Left edge - at or slightly beyond left edge
        : this.random(this.SCRN_W - edgeOffset, this.SCRN_W + edgeOffset); // Right edge - at or slightly beyond right edge
      
      // Y position - randomly from top to bottom, with small margins
      const yMargin = 50;
      const y = this.random(yMargin, this.SCRN_H - yMargin);
      
      // Scale variation - much smaller since viewBox is very large (0.08 to 0.2)
      const scale = this.random(0.1, 0.2);
      
      // Rotation variation (-15 to +15 degrees)
      const rotation = this.random(-15, 15);
      
      // Random flip (50% chance to flip horizontally)
      const flipHorizontal = this.random() > 0.5;
      
      this.branches.push({
        asset: asset,
        x: x,
        y: y,
        scale: scale,
        rotation: rotation,
        flipHorizontal: flipHorizontal
      });
    }
    
    console.log(`Initialized ${this.branches.length} and ${this.branches[0].scale} sakura branches and scales`);
  }
  
  // Add branches to SVG elements array
  addToSVG(svgElements) {
    for (const branch of this.branches) {
      const { asset, x, y, scale, rotation, flipHorizontal } = branch;
      
      // Build transform string
      // SVG transforms apply right-to-left, so we write them in reverse order
      // We want: scale/flip → rotate → position
      // String order (right-to-left execution): translate(center) → scale/flip → rotate → translate(position)
      
      // Get viewBox center for centering the branch
      const viewBoxCenterX = asset.viewBox[0] + asset.viewBox[2] / 2;
      const viewBoxCenterY = asset.viewBox[1] + asset.viewBox[3] / 2;
      
      // Build transform: scale/flip and rotate happen BEFORE positioning
      // Transform execution order (right-to-left, reading from end of string):
      // 1. translate(-center) - centers the branch (executed first)
      // 2. scale/flip - scales/flips the branch (executed second)
      // 3. rotate - rotates the scaled/flipped branch (executed third)
      // 4. translate(x, y) - positions the transformed branch (executed last)
      
      // Write transforms in reverse order (rightmost = executed first)
      // Start with position (rightmost in string, executed last)
      let transform = `translate(${x}, ${y})`;
      
      // Add rotation (executed third)
      if (rotation !== 0) {
        transform += ` rotate(${rotation})`;
      }
      
      // Add scale/flip (executed second)
      if (flipHorizontal) {
        transform += ` scale(${-scale}, ${scale})`;
      } else {
        transform += ` scale(${scale})`;
      }
      
      // Add centering (leftmost in string, executed first)
      transform += ` translate(${-viewBoxCenterX}, ${-viewBoxCenterY})`;
      
      // Start group (no clipping - branches protrude naturally)
      svgElements.push(`  <g transform="${transform}">`);
      
      // Render each path in the branch asset
      for (const path of asset.paths) {
        const pathElement = `    <path d="${path.d}" fill="${path.fill}"/>`;
        svgElements.push(pathElement);
      }
      
      // Close group
      svgElements.push(`  </g>`);
    }
  }
}

module.exports = SakuraBranchGenerator;

