"use client";

import { Phone, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { readEmergencyContacts, saveEmergencyContacts } from "@/lib/offline";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([{ name: "Family Emergency Contact", phone: "+91 00000 00000" }]);
  useEffect(() => {
    const saved = readEmergencyContacts();
    if (saved.length) setContacts(saved);
  }, []);
  useEffect(() => {
    saveEmergencyContacts(contacts);
  }, [contacts]);
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Emergency Contacts</h1>
        <button onClick={() => setContacts([...contacts, { name: "New Contact", phone: "" }])} className="grid size-10 place-items-center rounded-md bg-ember text-white" aria-label="Add contact">
          <Plus size={18} />
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {contacts.map((contact, index) => (
          <div key={index} className="rounded-lg border border-zinc-200 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 font-medium"><Phone size={18} className="text-rescue" />{contact.name}</div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{contact.phone || "Phone OTP/SMS dispatch ready"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
