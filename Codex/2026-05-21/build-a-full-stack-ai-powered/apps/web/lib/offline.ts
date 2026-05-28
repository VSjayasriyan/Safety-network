"use client";

import type { Coordinates } from "@surakshanet/shared";

const LAST_LOCATION_KEY = "surakshanet:last-location";
const SOS_DRAFT_KEY = "surakshanet:sos-draft";
const CONTACTS_KEY = "surakshanet:emergency-contacts";

export function saveLastLocation(location: Coordinates) {
  localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ ...location, savedAt: new Date().toISOString() }));
}

export function readLastLocation(): (Coordinates & { savedAt?: string }) | null {
  const value = localStorage.getItem(LAST_LOCATION_KEY);
  return value ? JSON.parse(value) : null;
}

export function saveOfflineSosDraft(message: string) {
  localStorage.setItem(SOS_DRAFT_KEY, JSON.stringify({ message, savedAt: new Date().toISOString() }));
}

export function readOfflineSosDraft(): { message: string; savedAt: string } | null {
  const value = localStorage.getItem(SOS_DRAFT_KEY);
  return value ? JSON.parse(value) : null;
}

export function saveEmergencyContacts(contacts: { name: string; phone: string }[]) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export function readEmergencyContacts() {
  const value = localStorage.getItem(CONTACTS_KEY);
  return value ? (JSON.parse(value) as { name: string; phone: string }[]) : [];
}
