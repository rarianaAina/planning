/**
 * L'application n'a qu'une utilisatrice et un seul planning : il n'y a pas
 * d'écran de connexion, le proxy ouvre directement la session de Colombe
 * pour tout visiteur.
 *
 * Supabase identifie un compte par un e-mail et un mot de passe de 6
 * caractères minimum : on utilise une adresse interne jamais affichée (domaine
 * réservé, RFC 2606 — aucun e-mail n'est envoyé) et le code allongé.
 *
 * Partagé par `src/proxy.ts` et `scripts/create-user.ts`.
 */
export const OWNER_NAME = "Colombe";
export const OWNER_CODE = "1234";

export const OWNER_EMAIL = "colombe@users.planning.example";
export const OWNER_PASSWORD = `planning-code-${OWNER_CODE}`;
