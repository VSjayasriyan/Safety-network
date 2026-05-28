import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  openWeatherKey: process.env.OPENWEATHER_API_KEY ?? "",
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  googleDistanceMatrixKey: process.env.GOOGLE_DISTANCE_MATRIX_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "",
  nasaFirmsKey: process.env.NASA_FIRMS_MAP_KEY ?? "",
  reliefWebAppName: process.env.RELIEFWEB_APPNAME ?? "surakshanet",
  gdacsRssUrl: process.env.GDACS_RSS_URL ?? "https://www.gdacs.org/xml/rss.xml",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000"
};
