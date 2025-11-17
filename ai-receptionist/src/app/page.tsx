"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  PhoneCall,
  RefreshCw,
  XCircle,
} from "lucide-react";

import type { Booking } from "@/lib/types";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const initialGreeting: Message = {
  role: "assistant",
  content:
    "Thanks for calling! You're speaking with Aiden, your virtual receptionist. How can I help you today?",
};

export default function Home() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    guestName: "",
    phoneNumber: "",
    email: "",
    service: "",
    startTime: "",
    durationMinutes: 45,
    notes: "",
  });

  const refreshBookings = useCallback(async () => {
    setLoadingBookings(true);
    const response = await fetch("/api/bookings");
    if (!response.ok) {
      setLoadingBookings(false);
      return;
    }

    const data = await response.json();
    setBookings(data.bookings ?? []);
    setLoadingBookings(false);
  }, []);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const upcoming = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          new Date(booking.startTime).getTime() >= Date.now() - 3 * 3600 * 1000,
      ),
    [bookings],
  );

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const nextMessages = [
      ...messages,
      { role: "user" as const, content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.reply ?? "Happy to help!" },
        ]);

        if (data.createdBooking || data.updatedBooking) {
          await refreshBookings();
        }
      } else {
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content:
              data.error ??
              "I'm having trouble connecting right now, but I can still take your details.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I lost connection for a moment. Could you repeat that or try again shortly?",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const resetCall = () => {
    setMessages([initialGreeting]);
  };

  const handleStatusChange = async (
    id: string,
    status: Booking["status"],
  ) => {
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      await refreshBookings();
    }
  };

  const submitManualBooking = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormSubmitting(true);
    setFormFeedback(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
          durationMinutes: Number(form.durationMinutes),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to save booking");
      }

      setForm({
        guestName: "",
        phoneNumber: "",
        email: "",
        service: "",
        startTime: "",
        durationMinutes: 45,
        notes: "",
      });
      setFormFeedback("Booking saved successfully.");
      await refreshBookings();
    } catch (error) {
      setFormFeedback(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the booking.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row">
        <section className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-blue-500/10 backdrop-blur">
          <header className="flex items-center justify-between border-b border-slate-800 px-8 py-6">
            <div>
              <div className="flex items-center gap-3 text-lg font-semibold">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <PhoneCall className="h-5 w-5" />
                </span>
                Live Call Console
              </div>
              <p className="text-sm text-slate-400">
                Capture caller intent, confirm details, and auto-create bookings.
              </p>
            </div>
            <button
              onClick={resetCall}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Call
            </button>
          </header>

          <div className="flex h-[32rem] flex-col gap-6 px-8 py-6">
            <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "assistant"
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "assistant"
                        ? "bg-slate-800/80 text-slate-100"
                        : "bg-emerald-500/20 text-emerald-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
                    Typing…
                  </div>
                </div>
              ) : null}
            </div>

            <form
              className="flex items-center gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                type="text"
                placeholder="Caller: e.g. I'd like to book an appointment tomorrow at 9am"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Send
              </button>
            </form>
          </div>
        </section>

        <section className="flex-1 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-900/50 backdrop-blur">
            <header className="flex items-center gap-3 border-b border-slate-800 px-8 py-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                <CalendarPlus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Upcoming Bookings
                </h2>
                <p className="text-sm text-slate-400">
                  Confirm or cancel reservations in real time.
                </p>
              </div>
            </header>

            <div className="divide-y divide-slate-800">
              {loadingBookings ? (
                <div className="px-8 py-10 text-center text-sm text-slate-400">
                  Syncing schedule…
                </div>
              ) : upcoming.length ? (
                upcoming.map((booking) => (
                  <article
                    key={booking.id}
                    className="flex flex-col gap-4 px-8 py-6 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white">
                        {booking.service} · {booking.guestName}
                      </p>
                      <p className="text-slate-300">
                        {format(
                          parseISO(booking.startTime),
                          "EEE, MMM d • h:mm aaa",
                        )}{" "}
                        · {booking.durationMinutes} min
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.phoneNumber} ·{" "}
                        {booking.email ?? "No email provided"}
                      </p>
                      {booking.notes ? (
                        <p className="text-xs text-slate-400">
                          {booking.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : booking.status === "pending"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {booking.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() =>
                          handleStatusChange(booking.id, "confirmed")
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirm
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(booking.id, "cancelled")
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/5 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-rose-100"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="px-8 py-10 text-center text-sm text-slate-400">
                  No upcoming bookings yet. Start a call or add one manually
                  below.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-900/50 backdrop-blur">
            <header className="flex items-center gap-3 border-b border-slate-800 px-8 py-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                <PhoneCall className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Manual Booking
                </h2>
                <p className="text-sm text-slate-400">
                  Capture details outside of the AI flow or pre-load the
                  calendar.
                </p>
              </div>
            </header>
            <form
              className="grid gap-4 px-8 py-6 text-sm"
              onSubmit={submitManualBooking}
            >
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <label className="space-y-1 text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Guest name
                  </span>
                  <input
                    required
                    value={form.guestName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        guestName: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="space-y-1 text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Phone number
                  </span>
                  <input
                    required
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <label className="space-y-1 text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Email (optional)
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="space-y-1 text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Service
                  </span>
                  <input
                    required
                    value={form.service}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        service: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <label className="space-y-1 text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Start time
                  </span>
                  <input
                    required
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        startTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
                <label className="space-y-1 text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Duration (minutes)
                  </span>
                  <input
                    required
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        durationMinutes: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </label>
              </div>

              <label className="space-y-1 text-slate-300">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Caller notes
                </span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </label>

              {formFeedback ? (
                <div
                  className={`rounded-2xl border px-3 py-2 text-xs ${
                    formFeedback.includes("successfully")
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-500/40 bg-rose-500/5 text-rose-200"
                  }`}
                >
                  {formFeedback}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {formSubmitting ? "Saving…" : "Save booking"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
