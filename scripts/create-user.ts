/**
 * Crée le compte de Colombe (ou remet son code à jour), confirmé d'office.
 *
 *   npm run create-user
 *
 * Utile seulement si la confirmation par e-mail est activée sur le projet
 * Supabase : sinon l'application crée elle-même le compte au premier accès.
 *
 * Nécessite dans .env.local, en plus des variables habituelles :
 *   SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings > API > service_role)
 * Cette clé contourne la RLS : elle ne doit jamais être exposée au
 * navigateur, d'où l'absence de préfixe NEXT_PUBLIC_.
 */
import { createClient } from "@supabase/supabase-js";
import { OWNER_EMAIL, OWNER_NAME, OWNER_PASSWORD } from "../src/lib/owner.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error } = await admin.auth.admin.createUser({
  email: OWNER_EMAIL,
  password: OWNER_PASSWORD,
  email_confirm: true,
  user_metadata: { display_name: OWNER_NAME },
});

if (!error) {
  console.log(`Compte « ${OWNER_NAME} » créé (${created.user.id}).`);
  process.exit(0);
}

if (!/already (been )?registered|already exists/i.test(error.message)) {
  console.error(`Échec : ${error.message}`);
  process.exit(1);
}

// Le compte existe déjà : on le confirme et on remet son code à jour.
const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
const existing = list?.users.find((u) => u.email === OWNER_EMAIL);
if (listError || !existing) {
  console.error(`Échec : ${listError?.message ?? "compte introuvable"}`);
  process.exit(1);
}

const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
  password: OWNER_PASSWORD,
  email_confirm: true,
});
if (updateError) {
  console.error(`Échec : ${updateError.message}`);
  process.exit(1);
}
console.log(`Le compte « ${OWNER_NAME} » existait déjà : il est confirmé et à jour.`);
