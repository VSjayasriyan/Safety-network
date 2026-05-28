"use client";

import { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Crosshair, LocateFixed, Route, TrafficCone } from "lucide-react";
import type { Coordinates, EmergencyAlert, SafePlace } from "@surakshanet/shared";
import { buildDangerCircles, googleDirectionsLink, googleMapOptions, loadGoogleMaps } from "@/lib/googleMaps";

export function LiveMap({
  location,
  accuracyMeters,
  places,
  alerts
}: {
  location: Coordinates | null;
  accuracyMeters?: number | null;
  places: SafePlace[];
  alerts: EmergencyAlert[];
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const accuracyRef = useRef<google.maps.Circle | null>(null);
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null);
  const weatherRef = useRef<google.maps.ImageMapType | null>(null);
  const dangerRefs = useRef<google.maps.Circle[]>([]);
  const placeMarkersRef = useRef<google.maps.Marker[]>([]);
  const clusterRef = useRef<MarkerClusterer | null>(null);
  const directionsRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [traffic, setTraffic] = useState(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_TRAFFIC !== "false");
  const [weather, setWeather] = useState(false);
  const [routeSummary, setRouteSummary] = useState<string>("");
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (!nodeRef.current || mapRef.current || !location) return;
    loadGoogleMaps()
      .then(() => {
        const map = new google.maps.Map(nodeRef.current!, googleMapOptions(location, dark));
        mapRef.current = map;
        userMarkerRef.current = new google.maps.Marker({
          map,
          position: location,
          title: "Your live location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#00d1b2",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3
          }
        });
        accuracyRef.current = new google.maps.Circle({
          map,
          center: location,
          radius: accuracyMeters ?? 40,
          fillColor: "#00d1b2",
          fillOpacity: 0.12,
          strokeColor: "#00d1b2",
          strokeOpacity: 0.45,
          strokeWeight: 1
        });
        trafficRef.current = new google.maps.TrafficLayer();
        if (traffic) trafficRef.current.setMap(map);
        directionsRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: { strokeColor: "#00d1b2", strokeWeight: 6, strokeOpacity: 0.88 }
        });
      })
      .catch(() => undefined);
  }, [accuracyMeters, dark, location, traffic]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;
    userMarkerRef.current?.setPosition(location);
    accuracyRef.current?.setCenter(location);
    accuracyRef.current?.setRadius(accuracyMeters ?? 40);
    if (autoCenter) map.panTo(location);
  }, [accuracyMeters, autoCenter, location]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    trafficRef.current?.setMap(traffic ? map : null);
  }, [traffic]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (weather && !weatherRef.current) {
      weatherRef.current = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => `https://tile.openweathermap.org/map/precipitation_new/${zoom}/${coord.x}/${coord.y}.png?appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? ""}`,
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.55,
        name: "Weather"
      });
    }
    if (weather && weatherRef.current) map.overlayMapTypes.setAt(0, weatherRef.current);
    if (!weather) map.overlayMapTypes.clear();
  }, [weather]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    dangerRefs.current.forEach((circle) => circle.setMap(null));
    dangerRefs.current = buildDangerCircles(alerts).map((zone) =>
      new google.maps.Circle({
        map,
        center: zone.center,
        radius: zone.radiusMeters,
        fillColor: zone.color,
        fillOpacity: 0.13,
        strokeColor: zone.color,
        strokeOpacity: 0.65,
        strokeWeight: 2
      })
    );
  }, [alerts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clusterRef.current?.clearMarkers();
    placeMarkersRef.current.forEach((marker) => marker.setMap(null));
    placeMarkersRef.current = places.map((place) => {
      const marker = new google.maps.Marker({
        position: place.coordinates,
        title: `${place.name} (${place.safetyScore})`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: place.safetyScore >= 80 ? 8 : 6,
          fillColor: place.safetyScore >= 80 ? "#00d1b2" : place.safetyScore >= 60 ? "#ff8a00" : "#ff3b1f",
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
      const info = new google.maps.InfoWindow({
        content: `<strong>${place.name}</strong><br/>${place.type.replace("_", " ")} · ${Math.round(place.distanceMeters)}m<br/>Safety score: ${place.safetyScore}`
      });
      marker.addListener("click", () => {
        info.open({ map, anchor: marker });
        if (location) drawRoute(place);
      });
      return marker;
    });
    clusterRef.current = new MarkerClusterer({ map, markers: placeMarkersRef.current });
  }, [places, location]);

  function drawRoute(place: SafePlace) {
    if (!location || !directionsRef.current) return;
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: location,
        destination: place.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS }
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result) return;
        directionsRef.current?.setDirections(result);
        const leg = result.routes[0]?.legs[0];
        setRouteSummary(leg ? `${leg.distance?.text ?? ""} · ${leg.duration_in_traffic?.text ?? leg.duration?.text ?? ""}` : "");
      }
    );
  }

  if (!location) {
    return <div className="grid h-[520px] place-items-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-white/10 dark:bg-black/30">Waiting for GPS permission...</div>;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/45 p-2">
        <button onClick={() => setAutoCenter((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white">
          {autoCenter ? <LocateFixed size={16} /> : <Crosshair size={16} />}
          {autoCenter ? "Auto-center on" : "Auto-center off"}
        </button>
        <button onClick={() => setTraffic((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white">
          <TrafficCone size={16} />
          Traffic
        </button>
        <button onClick={() => setWeather((value) => !value)} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white">
          <Route size={16} />
          Weather
        </button>
        {routeSummary && <span className="text-sm text-rescue">{routeSummary}</span>}
      </div>
      <div ref={nodeRef} className="h-[520px]" />
      {places[0] && location && (
        <a href={googleDirectionsLink(location, places[0].coordinates)} target="_blank" rel="noreferrer" className="block bg-ember px-4 py-3 text-center text-sm font-semibold text-white">
          Open emergency navigation to safest nearby place
        </a>
      )}
    </section>
  );
}
