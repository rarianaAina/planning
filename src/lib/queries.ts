import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { resolveDays } from "./schedule";
import type { DayOverride, ResolvedDay, Settings, TemplateSlot } from "./types";
import { mondayOf, todayISO } from "./date";

/** Mémoïsé par requête : évite de revalider le jeton à chaque appel. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Le proxy ouvre toujours la session de Colombe ; sans elle, c'est que le
  // compte n'a pas pu être ouvert.
  if (!user) redirect("/installation?compte=impossible");
  return { supabase, user };
});

/**
 * Les réglages sont créés par un trigger à l'inscription, mais on retombe
 * sur une création à la volée pour les comptes créés avant sa mise en place.
 */
export async function getSettings(): Promise<Settings> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("settings")
    .select("user_id, anchor_monday, anchor_week_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data as Settings;

  const fallback = {
    user_id: user.id,
    anchor_monday: mondayOf(todayISO()),
    anchor_week_type: "A" as const,
  };
  const { data: created, error: insertError } = await supabase
    .from("settings")
    .upsert(fallback, { onConflict: "user_id" })
    .select("user_id, anchor_monday, anchor_week_type")
    .single();

  if (insertError) throw new Error(insertError.message);
  return created as Settings;
}

export async function getTemplateSlots(): Promise<TemplateSlot[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("template_slots")
    .select("id, week_type, weekday, start_time, end_time, title, location, color")
    .eq("user_id", user.id)
    .order("weekday")
    .order("start_time");

  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateSlot[];
}

async function getOverrides(from: string, to: string): Promise<DayOverride[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("day_overrides")
    .select(
      "id, day, override_slots (id, override_id, start_time, end_time, title, location, color)",
    )
    .eq("user_id", user.id)
    .gte("day", from)
    .lte("day", to);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DayOverride[];
}

/** Charge et résout une plage de dates (bornes incluses). */
export async function loadDays(dates: string[]): Promise<{
  settings: Settings;
  days: ResolvedDay[];
}> {
  if (dates.length === 0) throw new Error("loadDays: plage vide");

  const from = dates[0];
  const to = dates[dates.length - 1];

  const [settings, templateSlots, overrides] = await Promise.all([
    getSettings(),
    getTemplateSlots(),
    getOverrides(from, to),
  ]);

  return { settings, days: resolveDays(dates, settings, templateSlots, overrides) };
}
