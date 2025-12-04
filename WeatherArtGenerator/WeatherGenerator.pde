// WeatherGenerator.pde
// Turns WeatherData into visuals. Extend/replace with your own logic.

class WeatherGenerator {
  long seed;
  WeatherData weather;

  // Derived visual parameters
  float hueBase;
  float satBase;
  float briBase;

  WeatherGenerator(long seed) {
    setSeed(seed);
  }

  void setSeed(long s) {
    seed = s;
    randomSeed(seed);
    noiseSeed(seed);
  }

  void setWeather(WeatherData w) {
    weather = w;
    computePalette();
  }

  void computePalette() {
    if (weather == null) return;

    // Example palette mapping:
    // - Temperature shifts hue: cold→blue(200) to hot→red(10)
    float t = constrain(map(weather.temperatureC, -20, 35, 200, 10), 0, 360);
    // - Cloudiness reduces brightness
    float cloudDim = map(weather.cloudinessPct, 0, 100, 100, 45);
    // - Humidity affects saturation
    float humSat = map(weather.humidityPct, 0, 100, 40, 90);

    // Day/night bias
    if (!weather.isDay) {
      cloudDim *= 0.8;
      humSat *= 0.9;
    }

    hueBase = t;
    satBase = humSat;
    briBase = cloudDim;
  }

  void update() {
    // Could react over time to wind, etc.
  }

  void render(PGraphics g, int w, int h) {
    
    g.pushStyle();
    g.noStroke();
    // Background gradient by cloudiness and time
    int steps = 180;
    for (int y = 0; y < steps; y++) 
    {
      float lerpY = y / float(steps-1);
      float h1 = hueBase;
      float s1 = satBase * 0.6;
      float b1 = briBase * 1.0;
      float h2 = (hueBase + 40) % 360;
      float s2 = satBase * 0.9;
      float b2 = briBase * 0.7;

      float hh = lerp(h1, h2, lerpY);
      float ss = lerp(s1, s2, lerpY);
      float bb = lerp(b1, b2, lerpY);
      
      // this will set the background colour
      g.fill(hh, ss, bb);
      g.rect(0, map(y, 0, steps-1, 0, h), w, h/float(steps));
    }
    
    
    // Wind-driven flow field lines
    if (weather != null) {
      drawWindField(g, w, h, weather.windSpeedMS, weather.windDeg, weather.beaufort);
    }

    // Clouds as noisy blobs (EEP: OKAY THIS NEEDS TO CHANGE!!!
    drawClouds(g, w, h, (weather != null) ? weather.cloudinessPct : 30);

    // Rain / Snow overlays
    if (weather != null) {
      if (weather.rain1hMM > 0.05 || weather.rain3hMM > 0.05) {
        drawRain(g, w, h, weather.rain1hMM + weather.rain3hMM);
      }
      if (weather.snow1hMM > 0.05 || weather.snow3hMM > 0.05) {
        drawSnow(g, w, h, weather.snow1hMM + weather.snow3hMM);
      }
    }

    // Visibility haze
    drawHaze(g, w, h, (weather != null) ? weather.visibilityM : 10000);
    
    // draws the vector fields
    drawWindField(g, w, h, 5, 45, 15);

    g.popStyle();
  }

  void drawClouds(PGraphics g, int w, int h, int cloudiness) {
    int blobs = int(map(cloudiness, 0, 100, 8, 60));
    g.pushStyle();
    g.noStroke();
    
    println("cloudiness = " + cloudiness);
    
    for (int i = 0; i < blobs; i++) {
      float nx = random(0, 1000);
      float ny = random(0, 1000);
      float cx = noise(nx) * w;
      float cy = noise(ny) * h * 0.6;
      float sz = map(cloudiness, 0, 100, 30, 200) * random(0.8, 1.8);
      g.fill((hueBase+10)%360, satBase*0.2, briBase*1.1, 22);
      g.ellipse(cx, cy, sz, sz * random(0.5, 1.2));
    }
    g.popStyle();
  }

  void drawRain(PGraphics g, int w, int h, float intensity) {
    int drops = int(constrain(map(intensity, 0, 10, 60, 1000), 40, 1500));
    g.pushStyle();
    g.stroke((hueBase+200)%360, satBase*0.5, briBase*0.7, 60);
    g.strokeWeight(1.2);
    for (int i = 0; i < drops; i++) {
      float x = random(w);
      float y1 = random(h);
      float y2 = y1 + random(8, 28);
      g.line(x, y1, x, y2);
    }
    g.popStyle();
  }

  void drawSnow(PGraphics g, int w, int h, float intensity) {
    int flakes = int(constrain(map(intensity, 0, 10, 40, 800), 20, 1200));
    g.pushStyle();
    g.noStroke();
    g.fill(0, 0, 100, 70);
    for (int i = 0; i < flakes; i++) {
      float x = random(w);
      float y = random(h);
      float r = random(1.2, 3.5);
      g.ellipse(x, y, r, r);
    }
    g.popStyle();
  }

  void drawWindField(PGraphics g, int w, int h, float speedMS, int deg, float beaufort) {
    int cols = 24;
    int rows = 32;
    float cellW = w / float(cols);
    float cellH = h / float(rows);

    float angle = radians(deg);
    float flow = map(beaufort, 0, 12, 0.3, 2.6);

    g.pushStyle();
    g.stroke((hueBase+320)%360, satBase*0.5, briBase*0.9, 50);
    g.strokeWeight(1.2);
    for (int j = 0; j < rows; j++) {
      for (int i = 0; i < cols; i++) {
        float cx = (i + 0.5) * cellW;
        float cy = (j + 0.5) * cellH;

        float n = noise(i*0.12, j*0.12, seed % 10000);
        float dir = angle + map(n, 0, 1, -PI/5, PI/5);
        float len = cellW * 0.6 * flow;
        float x2 = cx + cos(dir) * len;
        float y2 = cy + sin(dir) * len;

        g.line(cx, cy, x2, y2);
      }
    }
    g.popStyle();
  }

  void drawHaze(PGraphics g, int w, int h, int visibilityM) {
    float haze = map(constrain(visibilityM, 100, 20000), 100, 20000, 32, 0);
    g.pushStyle();
    g.noStroke();
    g.fill(hueBase, satBase*0.1, 100, haze);
    g.rect(0, 0, w, h);
    g.popStyle();
  }
}
