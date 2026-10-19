# Mon planning A/B

Application web qui remplace un planning papier en semaines alternées
(semaine A, semaine B, semaine A, semaine B…) par un emploi du temps
consultable **par jour, par semaine et par mois**, sur téléphone comme sur
ordinateur.

- **Une seule utilisatrice, sans connexion** — l'application est celle de
  Colombe : on l'ouvre et on s'en sert immédiatement, sans rien saisir. Le
  même planning s'affiche sur tous les appareils.
- **Modèle A/B** — on saisit une fois les deux semaines types ; elles se
  répètent ensuite indéfiniment en alternance.
- **Modification à la journée** — n'importe quelle date peut être ajustée
  (créneau ajouté, déplacé, supprimé, journée vidée) sans toucher au modèle.
  La journée se détache alors automatiquement du modèle, et un bouton
  « Revenir au modèle » permet de la raccrocher.
- **Trois vues** — la semaine est la vue d'accueil : numéro de semaine ISO
  (« Semaine 36 »), dates couvertes, et les sept jours en liste verticale,
  lisible d'un pouce sur téléphone. Sur grand écran, cette liste laisse place
  à une grille horaire où les chevauchements s'affichent côte à côte. Le mois
  reprend la marge du planning papier — numéro de semaine et type A/B — et le
  jour offre le détail modifiable.

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
3. Désactiver la confirmation par e-mail : **Authentication → Sign In /
   Providers → Email → Confirm email** décoché. L'application crée alors
   elle-même le compte de Colombe au premier accès.
4. Dans **Project Settings → API**, relever l'**URL du projet** et la clé
   **anon public**.

### Si la confirmation par e-mail doit rester activée

Le compte se crée alors avec la clé *service_role* (Project Settings → API).
L'ajouter dans `.env.local` sous `SUPABASE_SERVICE_ROLE_KEY=…` — jamais
dans Vercel ni avec le préfixe `NEXT_PUBLIC_` —, puis lancer une fois :

```bash
npm run create-user
```

### Le compte de Colombe

Il n'y a pas d'écran de connexion : pour chaque visiteur, le proxy ouvre la
session de l'unique compte, défini dans [`src/lib/owner.ts`](src/lib/owner.ts)
(nom « Colombe », code « 1234 »). Supabase exigeant un e-mail, le compte
utilise une adresse interne jamais affichée. **Toute personne qui connaît
l'adresse de l'application peut donc consulter et modifier le planning.**

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

1. Ouvrir l'application : elle est utilisable tout de suite.
2. **Réglages** — indiquer une semaine dont on est sûr et son type (A ou B).
   Toute l'alternance en découle, dans le passé comme dans le futur.
3. **Modèle A/B** — saisir les créneaux de la semaine A, puis ceux de la
   semaine B. Le bouton « Copier vers la semaine B » évite de tout ressaisir
   quand les deux semaines se ressemblent.
4. Consulter le planning en vue mois, semaine ou jour, et ajuster une date
   ponctuelle depuis la vue jour.

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
    (app)/          vues : mois, semaine, jour, modèle, réglages
    installation/   affichée tant que Supabase n'est pas configuré
  components/       composants d'interface partagés
  lib/
    date.ts         manipulation des dates en chaînes YYYY-MM-DD (heure locale)
    schedule.ts     alternance A/B, résolution des journées, placement des
                    créneaux qui se chevauchent
    queries.ts      lectures Supabase côté serveur
    actions.ts      Server Actions (écritures)
    supabase/       client serveur
  proxy.ts          ouvre la session de Colombe, rafraîchit le jeton et
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
