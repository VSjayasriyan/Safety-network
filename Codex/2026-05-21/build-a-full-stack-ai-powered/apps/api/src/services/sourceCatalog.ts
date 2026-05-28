export const emergencySourceCatalog = [
  "NDMA", "SACHET", "NDRF", "IMD", "INCOIS", "APSDMA", "ASDMA", "BSDMA", "GSDMA", "OSDMA", "KSDMA", "TNSDMA",
  "FEMA", "Ready.gov", "NOAA", "GDACS", "ReliefWeb", "UNDRR", "UNDAC", "IFRC", "GFDRR", "PDC Global",
  "PreventionWeb", "Copernicus EMS", "MeteoAlarm", "Sentinel Asia", "AHA Centre", "NASA Earth Observatory",
  "International Charter Space and Major Disasters", "CESDRR", "MHEWC", "Red Cross Emergency App",
  "Life360", "Safetipin", "bSafe", "Kaavala", "MyShake", "QuakeAlertUSA", "Disaster Alert", "Zello", "PulsePoint",
  "Alertable", "Everbridge", "Genasys Protect", "Citizen", "Emergency Plus", "HazardHunterPH", "BMKG Indonesia",
  "JMA Japan", "Geoscience Australia Alerts", "Civil Defence NZ", "WeatherCAN", "MeteoFrance Alerts",
  "UK Met Office Alerts", "Ready NSW", "CalFire Alerts", "Tsunami.gov", "USGS Earthquake Hazards Program",
  "Earthquake Network", "Windy", "RainViewer", "FloodWatch", "FireWatch", "Cyclocane", "Zoom Earth",
  "OpenStreetMap Humanitarian", "Ushahidi", "Humanitarian OpenStreetMap Team", "One Concern", "CrisisReady",
  "Google SOS Alerts", "Google Public Alerts", "Apple Emergency SOS", "Android Emergency Alerts",
  "Starlink Emergency Connectivity", "SkyAlert", "DisasterAWARE", "Humanitarian Data Exchange",
  "Global Forest Watch Fires", "FIRMS NASA", "EMSC", "AFAD Turkey", "PHIVOLCS", "PAGASA",
  "Singapore Civil Defence Force", "Dubai Police Emergency", "SAMU Brazil", "Protezione Civile Italy",
  "Sécurité Civile France", "Bundesamt Bevölkerungsschutz Germany", "Swiss Alertswiss", "SAWS South Africa",
  "Kenya Red Cross Alerts", "Qatar Meteorology Alerts", "Oman Meteorology Alerts", "Bahrain Civil Defence",
  "Kuwait Meteorology Department", "Saudi Civil Defense", "UAE NCEMA", "Hong Kong Observatory",
  "Taiwan CWB Alerts", "Korea Meteorological Administration", "China Emergency Management Ministry"
];

export const productionConnectorNotes = {
  capFeeds: "Prefer CAP/Common Alerting Protocol feeds for national alert authorities when available.",
  satellite: "Normalize FIRMS, Copernicus EMS, Sentinel Asia, Charter activations, and NASA products into geospatial hazard layers.",
  crowd: "Keep crowd reports isolated until verified by authority, responder, or trust-score workflows.",
  privacy: "Store precise live location only during active SOS or explicitly opted-in emergency sharing windows."
};
