# Mon planning A/B

Application web qui remplace un planning papier en semaines alternées
(semaine A, semaine B, semaine A, semaine B…) par un emploi du temps
consultable **par jour, par semaine et par mois**, sur téléphone comme sur
ordinateur.

- **Accès sans compte** — on arrive sur l'application et on s'en sert
  immédiatement, sans rien saisir : une session invitée est ouverte à la volée.
  Le planning est enregistré en base et rattaché au navigateur. On peut à tout
  moment lui associer une adresse e-mail pour le retrouver ailleurs, sans rien
  perdre de ce qui a déjà été saisi.
- **Modèle A/B** — on saisit une fois les deux semaines types ; elles se
  répètent ensuite indéfiniment en alternance.
- **Modification à la journée** — n'importe quelle date peut être ajustée
  (créneau ajouté, déplacé, supprimé, journée vidée) sans toucher au modèle.
  La journée se détache alors automatiquement du modèle, et un bouton
  « Revenir au modèle » permet de la raccrocher.
- **Trois vues** — mois (grille avec le type de semaine en marge, comme sur
  le papier), semaine (grille horaire, chevauchements affichés côte à côte),
  jour (liste détaillée et modifiable).

Stack : Next.js 16 (App Router, React Server Components), Tailwind CSS 4,
Supabase (Postgres + authentification), déploiement Vercel.

---

## 1. Créer la base Supabase

1. Créer un projet sur [supabase.com/dashboard](https://supabase.com/dashboard)
   (l'offre gratuite suffit).
2. Ouvrir **SQL Editor → New query**, coller le contenu de
   [`supabase/schema.sql`](supabase/schema.sql), puis exécuter. Cela crée les
   quatre tables, les politiques RLS (chaque compte ne voit que ses propres
   données) et le déclencheur qui initialise les réglages à l'inscription.
3. Activer l'accès sans compte : **Authentication → Sign In / Providers →
   Anonymous Sign-Ins → Enable**. Sans cela, l'application reste utilisable
   mais impose la création d'un compte.
4. Dans **Project Settings → API**, relever l'**URL du projet** et la clé
   **anon public**.

### Confirmation par e-mail (optionnel)

Par défaut Supabase envoie un e-mail de confirmation à l'inscription. Pour un
usage personnel, on peut la désactiver dans
**Authentication → Sign In / Providers → Email → Confirm email**.

## 2. Lancer en local

```bash
cp .env.local.example .env.local   # puis y coller l'URL et la clé anon
npm install
npm run dev
```

L'application est sur <http://localhost:3000>. Sans les variables
d'environnement, elle affiche une page d'installation qui rappelle ces étapes.

## 3. Déployer sur Vercel

1. Pousser le dépôt sur GitHub / GitLab.
2. Sur [vercel.com/new](https://vercel.com/new), importer le dépôt. Le preset
   Next.js est détecté automatiquement — aucun réglage de build à changer.
3. Dans **Settings → Environment Variables**, ajouter pour tous les
   environnements :

   | Nom | Valeur |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clé *anon public* |

4. Déployer. Ces deux valeurs sont publiques par conception : la sécurité
   repose sur les politiques RLS de Supabase, pas sur le secret de la clé.

## 4. Premier usage

1. Ouvrir l'application : elle est utilisable tout de suite, sans compte.
2. **Réglages** — indiquer une semaine dont on est sûr et son type (A ou B).
   Toute l'alternance en découle, dans le passé comme dans le futur.
3. **Modèle A/B** — saisir les créneaux de la semaine A, puis ceux de la
   semaine B. Le bouton « Copier vers la semaine B » évite de tout ressaisir
   quand les deux semaines se ressemblent.
4. Consulter le planning en vue mois, semaine ou jour, et ajuster une date
   ponctuelle depuis la vue jour.
5. Quand le planning est en place, **Réglages → Compte** permet de lui
   associer un e-mail et un mot de passe. L'identifiant interne ne change
   pas : le planning est conservé, et devient accessible depuis n'importe
   quel appareil.

### Sessions invitées

Une session invitée est un vrai utilisateur Supabase, sans e-mail, dont la
session vit dans un cookie. Les politiques RLS s'y appliquent exactement de la
même façon : un invité ne voit que son propre planning. Tant qu'aucune adresse
n'y est associée, effacer les données du navigateur rend le planning
inaccessible — c'est le compromis de l'accès sans inscription, et l'écran des
réglages le rappelle.

---

## Modèle de données

| Table | Rôle |
| --- | --- |
| `settings` | Semaine de référence et son type, d'où découle toute l'alternance. |
| `template_slots` | Les créneaux récurrents, rattachés à un type de semaine (A/B) et à un jour (1 = lundi … 7 = dimanche). |
| `day_overrides` | Une ligne par date détachée du modèle. |
| `override_slots` | Les créneaux propres à une date détachée. |

Règle de résolution d'une journée : **s'il existe un `day_override` pour la
date, il remplace intégralement le modèle ce jour-là** ; sinon les créneaux
du modèle correspondant au type de semaine et au jour s'appliquent. Une date
détachée sans aucun créneau est donc une journée volontairement vide.

Quand on modifie un créneau issu du modèle depuis la vue jour, la journée est
d'abord recopiée en `day_override` puis la modification s'applique à la copie :
le modèle reste intact.

## Structure

```
src/
  app/
    (app)/          vues authentifiées : mois, semaine, jour, modèle, réglages
    login/          connexion et création de compte
    installation/   affichée tant que Supabase n'est pas configuré
  components/       composants d'interface partagés
  lib/
    date.ts         manipulation des dates en chaînes YYYY-MM-DD (heure locale)
    schedule.ts     alternance A/B, résolution des journées, placement des
                    créneaux qui se chevauchent
    queries.ts      lectures Supabase côté serveur
    actions.ts      Server Actions (écritures)
    supabase/       clients navigateur et serveur
  proxy.ts          ouvre la session invitée, rafraîchit le jeton et
                    protège les routes
supabase/schema.sql tables, RLS et déclencheurs
```

## Scripts

```bash
npm run dev     # développement
npm run build   # build de production
npm start       # servir le build
npm run lint    # ESLint
```
