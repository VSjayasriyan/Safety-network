"use client";

import type { Coordinates } from "@surakshanet/shared";
import { googleMapsLink } from "./googleMaps";

export function buildEmergencyMessage(location: Coordinates, lastKnownLocation?: Coordinates | null) {
  const live = googleMapsLink(location);
  const last = lastKnownLocation ? googleMapsLink(lastKnownLocation) : live;
  return [
    "🚨 EMERGENCY ALERT from SurakshaNet",
    "I may need help.",
    "",
    `Live Location:\n${live}`,
    "",
    `Last Known Location:\n${last}`,
    "",
    "Please contact me immediately."
  ].join("\n");
}

export function whatsappShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function smsShareUrl(message: string) {
  return `sms:?&body=${encodeURIComponent(message)}`;
}

export function emailShareUrl(message: string) {
  return `mailto:?subject=${encodeURIComponent("SurakshaNet Emergency Alert")}&body=${encodeURIComponent(message)}`;
}
