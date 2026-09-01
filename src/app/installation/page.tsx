export const metadata = { title: "Installation — Mon planning A/B" };

const STEPS = [
  {
    title: "Créer un projet Supabase",
    body: (
      <>
        Sur{" "}
        <a
          className="underline decoration-dotted underline-offset-2"
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
        >
          supabase.com/dashboard
        </a>
        , créez un projet (l&rsquo;offre gratuite suffit largement).
      </>
    ),
  },
  {
    title: "Créer les tables",
    body: (
      <>
        Ouvrez <strong>SQL Editor → New query</strong>, collez le contenu du
        fichier <code className="font-mono text-[0.8em]">supabase/schema.sql</code>{" "}
        du projet, puis lancez la requête.
      </>
    ),
  },
  {
    title: "Autoriser l'accès sans compte",
    body: (
      <>
        Dans <strong>Authentication → Sign In / Providers</strong>, activer{" "}
        <strong>Anonymous Sign-Ins</strong>. C&rsquo;est ce qui permet
        d&rsquo;utiliser l&rsquo;application sans inscription. Sans cette
        option, l&rsquo;application fonctionne, mais impose la création
        d&rsquo;un compte.
      </>
    ),
  },
  {
    title: "Renseigner les deux variables d'environnement",
    body: (
      <>
        Dans <strong>Project Settings → API</strong>, copiez l&rsquo;URL du projet
        et la clé <em>anon public</em>, puis créez un fichier{" "}
        <code className="font-mono text-[0.8em]">.env.local</code> à la racine :
      </>
    ),
    code: `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`,
  },
  {
    title: "Redémarrer",
    body: (
      <>
        En local : arrêtez et relancez{" "}
        <code className="font-mono text-[0.8em]">npm run dev</code>. Sur Vercel :
        ajoutez les deux mêmes variables dans{" "}
        <strong>Settings → Environment Variables</strong>, puis redéployez.
      </>
    ),
  },
];

export default function InstallationPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Configuration requise</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        L&rsquo;application a besoin d&rsquo;une base Supabase pour enregistrer le
        planning. Cinq étapes, une seule fois.
      </p>

      <ol className="mt-7 space-y-5">
        {STEPS.map((step, i) => (
          <li key={step.title} className="card flex gap-4 p-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                {step.body}
              </p>
              {step.code && (
                <pre className="mt-2.5 overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-3 font-mono text-xs leading-relaxed">
                  {step.code}
                </pre>
              )}
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
