"use client";
// Remembers question numbers sent from this browser. Optional convenience only.
export type Ticket = { id: number; at: string; excerpt: string };
const KEY = "aqeedah.questions";

export function loadTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Ticket[];
  } catch {
    return [];
  }
}

export function saveTicket(t: Ticket) {
  try {
    const list = [t, ...loadTickets().filter((x) => x.id !== t.id)].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}
