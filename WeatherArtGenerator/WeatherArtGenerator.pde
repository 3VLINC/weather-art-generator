// WeatherArtGenerator.pde
// Main sketch: orchestrates fetching weather and drawing generative art.

WeatherClient weatherClient;
WeatherData weatherDataOttawa;
WeatherData weatherDataTokyo;
WeatherGenerator generator;

String openWeatherApiKey = "0ac1d8069d56a2476ab4c211e7a83e96"; // set me
String cityQuery1 = "Ottawa,CA"; // or "Tokyo,JP" // "Ottawa,CA"
String cityQuery2 = "Tokyo,JP";
boolean dataReady = false;
boolean isFetching = false;

int displayW = 960;   // 3:4 aspect for screen
int displayH = 1280;
int exportW = 1080;   // high-res export
int exportH = 1350;

void settings() {
  size(displayW, displayH, P2D);
  smooth(8);
}

void setup() {
  surface.setTitle("Weather Art Generator (Processing)");
  colorMode(HSB, 360, 100, 100, 100);
  weatherClient = new WeatherClient(openWeatherApiKey);
  fetchWeatherAsync(cityQuery1);
}

void draw() {
  background(0, 0, 8);

  if (!dataReady) {
    drawLoading();
    return;
  }

  if (generator == null && weatherDataOttawa != null) {
    long seed = System.currentTimeMillis() ^ (long)random(1<<30);
    generator = new WeatherGenerator(seed);
    generator.setWeather(weatherDataOttawa);
  }

  if (generator != null) {
    generator.update();
    generator.render(g, width, height);    // g is reserved variable like width & height!
    drawHud();
  }
}

void drawLoading() {
  pushStyle();
  fill(0, 0, 100, 10);
  noStroke();
  rect(0, 0, width, height);
  fill(0, 0, 100);
  textAlign(CENTER, CENTER);
  textSize(18);
  String msg = isFetching ? "Fetching weather…" : "Press 'R' to (re)fetch.";
  text(msg, width/2, height/2);
  popStyle();
}

void drawHud() 
{
  pushStyle();
  fill(0, 0, 100, 80);
  textSize(24);
  textAlign(LEFT, TOP);
  
  if (weatherDataOttawa != null && weatherDataTokyo != null) 
  {
    
    text(
      weatherDataOttawa.city + "  |  " +
      nf(weatherDataOttawa.temperatureC, 0, 1) + "°C  |  " +
      "Humidity " + weatherDataOttawa.humidityPct + "%  |  " +
      "Wind " + nf(weatherDataOttawa.windSpeedMS, 0, 1) + " m/s " + weatherDataOttawa.windCardinal + "  |  " +
      "Clouds " + weatherDataOttawa.cloudinessPct + "%  |  " +
      weatherDataOttawa.main + " / " + weatherDataOttawa.description,
      12, 12);
      
      text(
      weatherDataTokyo.city + "  |  " +
      nf(weatherDataTokyo.temperatureC, 0, 1) + "°C  |  " +
      "Humidity " + weatherDataTokyo.humidityPct + "%  |  " +
      "Wind " + nf(weatherDataTokyo.windSpeedMS, 0, 1) + " m/s " + weatherDataTokyo.windCardinal + "  |  " +
      "Clouds " + weatherDataTokyo.cloudinessPct + "%  |  " +
      weatherDataTokyo.main + " / " + weatherDataTokyo.description,
      12, 50);
  }
  popStyle();
}

// Trigger a refetch (R), randomize seed (Space), export high-res (E)
void keyPressed() {
  if (key == 'r' || key == 'R') {
    fetchWeatherAsync(cityQuery1);
    fetchWeatherAsync(cityQuery2);
  } else if (key == ' ') {
    if (generator != null) {
      long newSeed = System.currentTimeMillis() ^ (long)random(1<<30);
      generator.setSeed(newSeed);
    }
  } else if (key == 'e' || key == 'E') {
    exportHighRes();
  }
}

void fetchWeatherAsync(String query) {
  isFetching = true;
  dataReady = false;
  generator = null;

  // Non-blocking: run in a separate thread to avoid stalling draw()
  thread("doFetch");
}

// really cool, runs a separate thread to fetch the data behind-the-scenes
void doFetch() {
  try {
    WeatherData wd1 = weatherClient.fetchCurrentByCity(cityQuery1);
    weatherDataOttawa = wd1;
    
    WeatherData wd2 = weatherClient.fetchCurrentByCity(cityQuery2);
    weatherDataTokyo = wd2;
    
    dataReady = true;
  } catch (Exception e) {
    println("Fetch error: " + e.getMessage());
    dataReady = false;
  } finally {
    isFetching = false;
  }
}

void exportHighRes() {
  if (weatherDataOttawa == null || weatherDataTokyo == null) return;
  
  PGraphics pg = createGraphics(exportW, exportH, P2D);
  pg.beginDraw();
  pg.colorMode(HSB, 360, 100, 100, 100);
  pg.background(0, 0, 8);
  
  if (generator != null) 
  {
    generator.render(pg, exportW, exportH);
  }
  pg.endDraw();
  String filename = "weather_art_" + millis() + "_" + weatherDataOttawa.city.replace(' ', '_') + ".png";
  pg.save(filename);
  println("Saved high-res: " + filename);
}
