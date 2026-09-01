"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { getSettings, getTemplateSlots, requireUser } from "./queries";
import { isoWeekday, mondayOf, timeToMinutes } from "./date";
import { weekTypeFor } from "./schedule";
import { DEFAULT_COLOR, isColorName } from "./colors";
import type { WeekType } from "./types";

export type ActionState = { error?: string; ok?: boolean };

const OK: ActionState = { ok: true };
const fail = (error: string): ActionState => ({ error });

function refresh() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------
// Validation partagée des champs d'un créneau
// ---------------------------------------------------------------------
type SlotFields = {
  title: string;
  location: string | null;
  color: string;
  start_time: string;
  end_time: string;
};

function readSlotFields(formData: FormData): SlotFields | string {
  const title = String(formData.get("title") ?? "").trim();
  const start = String(formData.get("start_time") ?? "").trim();
  const end = String(formData.get("end_time") ?? "").trim();
  const rawLocation = String(formData.get("location") ?? "").trim();
  const rawColor = String(formData.get("color") ?? "");

  if (!title) return "Le titre est obligatoire.";
  if (title.length > 120) return "Le titre est trop long (120 caractères max).";
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return "Les horaires sont invalides.";
  }
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    return "L'heure de fin doit être après l'heure de début.";
  }

  return {
    title,
    location: rawLocation || null,
    color: isColorName(rawColor) ? rawColor : DEFAULT_COLOR,
    start_time: start,
    end_time: end,
  };
}

function readWeekType(value: FormDataEntryValue | null): WeekType {
  return value === "B" ? "B" : "A";
}

function readDate(formData: FormData, field = "date"): string | null {
  const value = String(formData.get(field) ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

// =====================================================================
// Réglages
// =====================================================================
export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const reference = readDate(formData, "reference");
  if (!reference) return fail("Date de référence invalide.");

  const { error } = await supabase.from("settings").upsert(
    {
      user_id: user.id,
      anchor_monday: mondayOf(reference),
      anchor_week_type: readWeekType(formData.get("week_type")),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return fail(error.message);
  refresh();
  return OK;
}

// =====================================================================
// Modèle récurrent (semaine A / semaine B)
// =====================================================================
export async function saveTemplateSlotAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const fields = readSlotFields(formData);
  if (typeof fields === "string") return fail(fields);

  const weekday = Number(formData.get("weekday"));
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    return fail("Jour de la semaine invalide.");
  }

  const id = String(formData.get("id") ?? "");
  const payload = {
    user_id: user.id,
    week_type: readWeekType(formData.get("week_type")),
    weekday,
    ...fields,
  };

  const { error } = id
    ? await supabase.from("template_slots").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("template_slots").insert(payload);

  if (error) return fail(error.message);
  refresh();
  return OK;
}

export async function deleteTemplateSlotAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("template_slots").delete().eq("id", id).eq("user_id", user.id);
    refresh();
  }
}

/** Recopie tous les créneaux d'une semaine type vers l'autre (écrase la cible). */
export async function copyWeekAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const from = readWeekType(formData.get("from"));
  const to: WeekType = from === "A" ? "B" : "A";

  const slots = (await getTemplateSlots()).filter((s) => s.week_type === from);

  await supabase
    .from("template_slots")
    .delete()
    .eq("user_id", user.id)
    .eq("week_type", to);

  if (slots.length > 0) {
    await supabase.from("template_slots").insert(
      slots.map((s) => ({
        user_id: user.id,
        week_type: to,
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
        title: s.title,
        location: s.location,
        color: s.color,
      })),
    );
  }

  refresh();
}

// =====================================================================
// Journées personnalisées
// =====================================================================

/**
 * Garantit qu'un `day_override` existe pour la date, en le pré-remplissant
 * avec une copie des créneaux du modèle. Renvoie l'id de l'override et la
 * correspondance entre id de créneau modèle et id de créneau copié — la
 * copie est insérée dans l'ordre des créneaux triés, donc l'index suffit.
 */
async function ensureOverride(date: string): Promise<{
  overrideId: string;
  mapping: Map<string, string>;
}> {
  const { supabase, user } = await requireUser();

  const { data: existing, error: lookupError } = await supabase
    .from("day_overrides")
    .select("id")
    .eq("user_id", user.id)
    .eq("day", date)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing) return { overrideId: existing.id, mapping: new Map() };

  const { data: created, error: createError } = await supabase
    .from("day_overrides")
    .insert({ user_id: user.id, day: date })
    .select("id")
    .single();

  if (createError) throw new Error(createError.message);
  const overrideId = created.id as string;

  const [settings, templateSlots] = await Promise.all([
    getSettings(),
    getTemplateSlots(),
  ]);
  const weekType = weekTypeFor(date, settings);
  const weekday = isoWeekday(date);

  const seed = templateSlots
    .filter((s) => s.week_type === weekType && s.weekday === weekday)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const mapping = new Map<string, string>();
  if (seed.length > 0) {
    const { data: inserted, error: seedError } = await supabase
      .from("override_slots")
      .insert(
        seed.map((s) => ({
          override_id: overrideId,
          user_id: user.id,
          start_time: s.start_time,
          end_time: s.end_time,
          title: s.title,
          location: s.location,
          color: s.color,
        })),
      )
      .select("id");

    if (seedError) throw new Error(seedError.message);
    (inserted ?? []).forEach((row, i) => mapping.set(seed[i].id, row.id as string));
  }

  return { overrideId, mapping };
}

/** Détache explicitement une journée du modèle, sans rien modifier d'autre. */
export async function customizeDayAction(formData: FormData) {
  const date = readDate(formData);
  if (!date) return;
  await ensureOverride(date);
  refresh();
}

/** Rebranche la journée sur le modèle A/B (supprime la personnalisation). */
export async function resetDayAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const date = readDate(formData);
  if (!date) return;

  await supabase.from("day_overrides").delete().eq("user_id", user.id).eq("day", date);
  refresh();
}

/** Vide la journée : personnalisée, mais sans aucun créneau. */
export async function clearDayAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const date = readDate(formData);
  if (!date) return;

  const { overrideId } = await ensureOverride(date);
  await supabase
    .from("override_slots")
    .delete()
    .eq("override_id", overrideId)
    .eq("user_id", user.id);
  refresh();
}

/**
 * Crée ou met à jour un créneau sur une date précise. Si la journée suivait
 * encore le modèle, elle est automatiquement détachée au préalable.
 */
export async function saveDaySlotAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const date = readDate(formData);
  if (!date) return fail("Date invalide.");

  const fields = readSlotFields(formData);
  if (typeof fields === "string") return fail(fields);

  const { overrideId, mapping } = await ensureOverride(date);

  const rawId = String(formData.get("id") ?? "");
  // Un créneau issu du modèle a été recopié : on vise sa copie.
  const id = rawId ? (mapping.get(rawId) ?? rawId) : "";

  if (id) {
    const { data, error } = await supabase
      .from("override_slots")
      .update(fields)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (error) return fail(error.message);
    // Le créneau visé n'existe plus : la page affichait un état périmé.
    if (!data || data.length === 0) {
      return fail("Ce créneau n'existe plus. Rechargez la page.");
    }
  } else {
    const { error } = await supabase
      .from("override_slots")
      .insert({ override_id: overrideId, user_id: user.id, ...fields });

    if (error) return fail(error.message);
  }

  refresh();
  return OK;
}

export async function deleteDaySlotAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const date = readDate(formData);
  const rawId = String(formData.get("id") ?? "");
  if (!date || !rawId) return;

  const { mapping } = await ensureOverride(date);
  const id = mapping.get(rawId) ?? rawId;

  await supabase.from("override_slots").delete().eq("id", id).eq("user_id", user.id);
  refresh();
}

// =====================================================================
// Session
// =====================================================================
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
