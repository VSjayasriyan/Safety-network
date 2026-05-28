export default function AboutPage() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 leading-7 dark:border-white/10 dark:bg-white/[0.04]">
      <h1 className="text-2xl font-semibold">About SurakshaNet</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">
        SurakshaNet combines GPS, Google Maps, Google Places, Google Directions, Google Distance Matrix, OpenStreetMap/HOT, USGS, ReliefWeb, OpenWeather, NASA FIRMS, FEMA/OpenFEMA, GDACS, NOAA-style alert feeds, and national/state disaster data connectors into one emergency safety platform.
      </p>
      <p className="mt-3 text-zinc-600 dark:text-zinc-300">
        The architecture is designed for national disaster management: PostGIS geospatial ranking, Redis caching, AI microservices, push-ready SOS events, crowd-sourced incident reports, and extensible adapters for NDMA, SACHET, NDRF, IMD, INCOIS, FEMA, PDC, Copernicus EMS, IFRC, and regional alert authorities.
      </p>
    </section>
  );
}
