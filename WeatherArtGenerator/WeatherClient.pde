// WeatherClient.pde
// Minimal OpenWeather Current API client using Processing's loadJSONObject.

class WeatherClient {
  final String apiKey;

  WeatherClient(String apiKey) {
    this.apiKey = apiKey;
  }

  WeatherData fetchCurrentByCity(String query) {
    String url = "https://api.openweathermap.org/data/2.5/weather?q=" +
                 urlencode(query) + "&appid=" + apiKey + "&units=metric";
    JSONObject json = loadJSONObject(url);
    return new WeatherData().fromOpenWeather(json);
  }

  WeatherData fetchCurrentByCoords(float lat, float lon) {
    String url = "https://api.openweathermap.org/data/2.5/weather?lat=" +
                 nf(lat, 0, 4) + "&lon=" + nf(lon, 0, 4) +
                 "&appid=" + apiKey + "&units=metric";
    JSONObject json = loadJSONObject(url);
    return new WeatherData().fromOpenWeather(json);
  }

  // Simple URL-encoding for city queries
  String urlencode(String s) {
    return s.replace(" ", "%20");
  }
}
