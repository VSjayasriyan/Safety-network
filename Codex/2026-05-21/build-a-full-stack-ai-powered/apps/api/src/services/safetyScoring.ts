import type { EmergencyAlert, SafePlace } from "@surakshanet/shared";
import { clampScore, haversineMeters } from "./geo.js";

const typeWeights: Record<string, number> = {
  hospital: 18,
  police: 15,
  shelter: 20,
  fire_station: 14,
  emergency_camp: 22,
  restaurant: 6,
  pharmacy: 12,
  office: 8,
  public_zone: 10
};

const severityRisk = { minor: 7, moderate: 16, severe: 30, extreme: 45 };

export function scoreSafePlace(place: SafePlace, alerts: EmergencyAlert[]): SafePlace {
  const distanceBonus = Math.max(0, 25 - place.distanceMeters / 250);
  const typeBonus = typeWeights[place.type] ?? 8;
  const capacityBonus = (place.capacityScore ?? 0.65) * 15;
  const accessibilityBonus = (place.accessibilityScore ?? 0.65) * 15;
  const openBonus = place.openNow === false ? -20 : 8;

  const nearbyAlertPenalty = alerts.reduce((total, alert) => {
    if (!alert.coordinates) return total;
    const radiusMeters = (alert.radiusKm ?? 10) * 1000;
    const distance = haversineMeters(place.coordinates, alert.coordinates);
    if (distance > radiusMeters) return total;
    const proximity = 1 - distance / radiusMeters;
    return total + severityRisk[alert.severity] * proximity;
  }, 0);

  const score = clampScore(30 + distanceBonus + typeBonus + capacityBonus + accessibilityBonus + openBonus - nearbyAlertPenalty);
  const reasons = [
    `${Math.round(place.distanceMeters)}m away`,
    `${place.type.replace("_", " ")} suitability`,
    nearbyAlertPenalty > 0 ? "near active hazard boundary" : "outside immediate hazard radius"
  ];

  return { ...place, safetyScore: score, routeRiskScore: clampScore(nearbyAlertPenalty * 1.8), reasons };
}
