"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default function BookingPage() {
  return <AppShell><Suspense fallback={<BookingLoading/>}><BookingInterface/></Suspense></AppShell>;
}

function BookingLoading() {
  return <main className="workspace narrow"><div className="panel"><p className="kicker">SESSION BOOKING</p><h1>Loading booking details…</h1></div></main>;
}

function BookingInterface() {
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ trainerId: params.get("trainer") || "", startsAt: "", endsAt: "", notes: "" });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("Submitting…");
    const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setMessage(response.ok ? `Confirmed. Booking reference: ${data.bookingId}` : data.error || "Booking could not be created.");
  }
  return <main className="workspace narrow"><header className="workspace-header"><div><p className="kicker">SESSION BOOKING</p><h1>Reserve your time.</h1><p>Confirmed sessions are protected from schedule conflicts at the database level.</p></div></header><form className="form-card" onSubmit={submit}><label>Trainer UUID<input required value={form.trainerId} onChange={event => setForm({ ...form, trainerId: event.target.value })}/></label><label>Start time<input type="datetime-local" required onChange={event => setForm({ ...form, startsAt: new Date(event.target.value).toISOString() })}/></label><label>End time<input type="datetime-local" required onChange={event => setForm({ ...form, endsAt: new Date(event.target.value).toISOString() })}/></label><label>Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })}/></label><button className="button" type="submit">Confirm booking</button>{message ? <p className="form-message">{message}</p> : null}</form></main>;
}
