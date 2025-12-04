// WeatherData.pde
// DTO + derived properties that are useful for art decisions.

class WeatherData {
  // Core conditions
  String main = "";
  String description = "";
  int conditionId = 0;
  String icon = "";

  // Temperature/humidity/pressure
  float temperatureC = 0;
  float feelsLikeC = 0;
  float tempMinC = 0;
  float tempMaxC = 0;
  int humidityPct = 0;
  int pressureHPa = 0;

  // Wind
  float windSpeedMS = 0;
  float windGustMS = 0;
  int windDeg = 0;
  String windCardinal = "N";

  // Clouds/visibility
  int cloudinessPct = 0;
  int visibilityM = 0;

  // Precip
  float rain1hMM = 0;
  float rain3hMM = 0;
  float snow1hMM = 0;
  float snow3hMM = 0;

  // Time and location
  int dt = 0;
  int sunrise = 0;
  int sunset = 0;
  float lat = 0;
  float lon = 0;
  String city = "";
  String country = "";
  int timezoneOffset = 0;

  // Derived
  boolean isDay = true;
  float dewPointC = Float.NaN; // if you later add One Call
  float uvIndex = Float.NaN;   // if you later add One Call
  float beaufort = 0;

  WeatherData fromOpenWeather(JSONObject json) {
    WeatherData w = new WeatherData();
    if (json == null) throw new RuntimeException("Null weather JSON");

    // Location
    w.city = json.hasKey("name") ? json.getString("name") : "";
    if (json.hasKey("sys")) {
      JSONObject sys = json.getJSONObject("sys");
      if (sys.hasKey("country")) w.country = sys.getString("country");
      if (sys.hasKey("sunrise")) w.sunrise = sys.getInt("sunrise");
      if (sys.hasKey("sunset"))  w.sunset  = sys.getInt("sunset");
    }
    if (json.hasKey("coord")) {
      JSONObject c = json.getJSONObject("coord");
      if (c.hasKey("lat")) w.lat = c.getFloat("lat");
      if (c.hasKey("lon")) w.lon = c.getFloat("lon");
    }

    // Timing
    if (json.hasKey("dt")) w.dt = json.getInt("dt");
    if (json.hasKey("timezone")) w.timezoneOffset = json.getInt("timezone");

    // Weather array (first item)
    if (json.hasKey("weather")) {
      JSONArray arr = json.getJSONArray("weather");
      if (arr.size() > 0) {
        JSONObject we = arr.getJSONObject(0);
        if (we.hasKey("main")) w.main = we.getString("main");
        if (we.hasKey("description")) w.description = w.capitalizeWords(we.getString("description"));
        if (we.hasKey("id")) w.conditionId = we.getInt("id");
        if (we.hasKey("icon")) w.icon = we.getString("icon");
      }
    }

    // Main readings
    if (json.hasKey("main")) {
      JSONObject m = json.getJSONObject("main");
      if (m.hasKey("temp")) w.temperatureC = m.getFloat("temp");
      if (m.hasKey("feels_like")) w.feelsLikeC = m.getFloat("feels_like");
      if (m.hasKey("temp_min")) w.tempMinC = m.getFloat("temp_min");
      if (m.hasKey("temp_max")) w.tempMaxC = m.getFloat("temp_max");
      if (m.hasKey("humidity")) w.humidityPct = m.getInt("humidity");
      if (m.hasKey("pressure")) w.pressureHPa = m.getInt("pressure");
    }

    // Wind
    if (json.hasKey("wind")) {
      JSONObject wj = json.getJSONObject("wind");
      if (wj.hasKey("speed")) w.windSpeedMS = wj.getFloat("speed");
      if (wj.hasKey("gust")) w.windGustMS = wj.getFloat("gust");
      if (wj.hasKey("deg")) w.windDeg = wj.getInt("deg");
      w.windCardinal = w.windDegToCardinal(w.windDeg);
      w.beaufort = w.windSpeedToBeaufort(w.windSpeedMS);
    }

    // Clouds
    if (json.hasKey("clouds")) {
      JSONObject cl = json.getJSONObject("clouds");
      if (cl.hasKey("all")) w.cloudinessPct = cl.getInt("all");
    }

    // Visibility
    if (json.hasKey("visibility")) w.visibilityM = json.getInt("visibility");

    // Precip
    if (json.hasKey("rain")) {
      JSONObject r = json.getJSONObject("rain");
      if (r.hasKey("1h")) w.rain1hMM = r.getFloat("1h");
      if (r.hasKey("3h")) w.rain3hMM = r.getFloat("3h");
    }
    if (json.hasKey("snow")) {
      JSONObject s = json.getJSONObject("snow");
      if (s.hasKey("1h")) w.snow1hMM = s.getFloat("1h");
      if (s.hasKey("3h")) w.snow3hMM = s.getFloat("3h");
    }

    // Day/night
    w.isDay = (w.dt >= w.sunrise && w.dt <= w.sunset);

    return w;
  }

  String windDegToCardinal(int deg) {
    String[] dirs = { "N","NNE","NE","ENE","E","ESE","SE","SSE","S",
                      "SSW","SW","WSW","W","WNW","NW","NNW" };
    int idx = floor(((deg + 11.25f) % 360) / 22.5f);
    return dirs[idx];
  }

  float windSpeedToBeaufort(float ms) {
    // Approx conversion
    float[] thresholds = {0.3,1.6,3.4,5.5,8.0,10.8,13.9,17.2,20.8,24.5,28.5,32.7};
    for (int i=0; i<thresholds.length; i++) {
      if (ms < thresholds[i]) return i;
    }
    return 12;
  }

  String capitalizeWords(String s) {
    String[] parts = splitTokens(s, " ");
    for (int i=0; i<parts.length; i++) {
      if (parts[i].length() > 0) {
        parts[i] = parts[i].substring(0,1).toUpperCase() + parts[i].substring(1);
      }
    }
    return join(parts, " ");
  }
}
