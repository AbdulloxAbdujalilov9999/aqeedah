import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isLang, makeT, type Script } from "@/lib/i18n";

export async function getScript(): Promise<Script> {
  const store = await cookies();
  return store.get("script")?.value === "cyr" ? "cyr" : "lat";
}

export async function getCtx(langParam: string) {
  if (!isLang(langParam)) notFound();
  return makeT(langParam, await getScript());
}
