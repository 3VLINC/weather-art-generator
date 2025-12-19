// PerlinNoise.js
// Perlin noise implementation for generating organic, natural-looking textures
// Ported from server-svg-generator.js and Processing noise() function

class PerlinNoise {
  constructor(seed) {
    this.seed = seed;
    this.p = [];
    this.initPerlinNoise();
  }
  
  // Initialize Perlin noise permutation table (seeded)
  initPerlinNoise() {
    // Create permutation array [0..255]
    this.p = [];
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    
    // Shuffle using seeded random (LCG algorithm)
    let randomState = this.seed & 0x7fffffff;
    if (randomState === 0) randomState = 1;
    
    for (let i = 255; i > 0; i--) {
      randomState = (randomState * 1103515245 + 12345) & 0x7fffffff;
      const rnd = randomState / 0x7fffffff;
      const j = Math.floor(rnd * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    
    // Duplicate the permutation array
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i];
    }
  }
  
  // Fade function for smooth interpolation (6t^5 - 15t^4 + 10t^3)
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // Linear interpolation
  lerp(a, b, t) {
    return a + t * (b - a);
  }
  
  // Gradient function - generates a random gradient vector
  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : 0);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  // 2D Perlin noise function
  // Returns value between 0 and 1
  noise(x, y) {
    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    // Get relative x,y coordinates of point within that cell
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // Compute fade curves for each of x,y
    const u = this.fade(x);
    const v = this.fade(y);
    
    // Hash coordinates of the 4 square corners
    const A = this.p[X] + Y;
    const AA = this.p[A];
    const AB = this.p[A + 1];
    const B = this.p[X + 1] + Y;
    const BA = this.p[B];
    const BB = this.p[B + 1];
    
    // And add blended results from 4 corners of the square
    return this.lerp(
      this.lerp(this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y), u),
      this.lerp(this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1), u),
      v
    ) * 0.5 + 0.5; // Normalize to 0-1 range
  }
  
  // Map a value from one range to another
  map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }
  
  // Octave noise (fractal noise) - combines multiple noise layers
  octaveNoise(x, y, octaves = 4, persistence = 0.5, scale = 1.0) {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return value / maxValue;
  }
}

module.exports = PerlinNoise;


