"use client";

import { Mail, MessageCircle, MessageSquare, Siren } from "lucide-react";
import { useState } from "react";
import type { Coordinates } from "@surakshanet/shared";
import { sendSos } from "@/lib/api";
import { buildEmergencyMessage, emailShareUrl, smsShareUrl, whatsappShareUrl } from "@/lib/sos";
import { saveOfflineSosDraft } from "@/lib/offline";

export function SosButton({ location, lastKnownLocation }: { location: Coordinates | null; lastKnownLocation?: Coordinates | null }) {
  const [status, setStatus] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  async function trigger() {
    if (!location) {
      setStatus("Enable GPS before sending SOS.");
      return;
    }
    const nextMessage = buildEmergencyMessage(location, lastKnownLocation);
    setMessage(nextMessage);
    saveOfflineSosDraft(nextMessage);
    try {
      const result = await sendSos(location, nextMessage, []);
      setStatus(result.message);
    } catch {
      setStatus("SOS draft saved offline. Share it by WhatsApp, SMS, or email when available.");
    }
  }

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
      <button onClick={trigger} className="alert-pulse flex w-full items-center justify-center gap-2 rounded-md bg-ember px-4 py-3 font-semibold text-white">
        <Siren size={20} />
        SOS Emergency
      </button>
      {message && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a className="grid place-items-center rounded-md bg-white/10 p-2 text-white" href={whatsappShareUrl(message)} target="_blank" rel="noreferrer" aria-label="Share by WhatsApp"><MessageCircle size={18} /></a>
          <a className="grid place-items-center rounded-md bg-white/10 p-2 text-white" href={smsShareUrl(message)} aria-label="Share by SMS"><MessageSquare size={18} /></a>
          <a className="grid place-items-center rounded-md bg-white/10 p-2 text-white" href={emailShareUrl(message)} aria-label="Share by email"><Mail size={18} /></a>
        </div>
      )}
      {status && <p className="mt-2 text-sm text-red-200">{status}</p>}
    </div>
  );
}
