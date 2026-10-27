import type { Metadata } from "next";
import { getCtx } from "@/lib/ctx";
import { dict, type Key } from "@/lib/i18n";
import TrackView from "./TrackView";

export const metadata: Metadata = { title: "Savolim holati · Track" };

const KEYS: Key[] = [
  "track_intro", "number", "track_btn", "track_not_found", "my_questions", "st_received", "st_assigned",
  "st_answering", "st_in_review", "st_answered", "st_declined", "st_duplicate", "read_answer", "private_note",
  "decline_reason", "err_generic",
];

export default async function TrackPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang: l } = await params;
  const sp = await searchParams;
  const { t, lang, script } = await getCtx(l);
  return (
    <div className="wrap narrow stack-lg">
      <h1>{t("track_title")}</h1>
      <TrackView lang={lang} d={dict(lang, script, KEYS)} initialId={sp.id ?? ""} />
    </div>
  );
}
