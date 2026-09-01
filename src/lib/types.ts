export type WeekType = "A" | "B";

/** 1 = lundi … 7 = dimanche (ISO-8601) */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Settings = {
  user_id: string;
  anchor_monday: string; // YYYY-MM-DD
  anchor_week_type: WeekType;
};

export type TemplateSlot = {
  id: string;
  week_type: WeekType;
  weekday: number;
  start_time: string; // HH:MM:SS
  end_time: string;
  title: string;
  location: string | null;
  color: string;
};

export type OverrideSlot = {
  id: string;
  override_id: string;
  start_time: string;
  end_time: string;
  title: string;
  location: string | null;
  color: string;
};

export type DayOverride = {
  id: string;
  day: string; // YYYY-MM-DD
  override_slots: OverrideSlot[];
};

/** Un créneau prêt à afficher, quelle que soit son origine. */
export type ResolvedSlot = {
  id: string;
  start: string; // HH:MM
  end: string; // HH:MM
  startMin: number;
  endMin: number;
  title: string;
  location: string | null;
  color: string;
};

/** Une journée résolue : modèle A/B, ou personnalisation si elle existe. */
export type ResolvedDay = {
  date: string; // YYYY-MM-DD
  weekday: number;
  weekType: WeekType;
  customized: boolean;
  overrideId: string | null;
  slots: ResolvedSlot[];
};
