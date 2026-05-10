# unsite.

> *Une seule personne à la fois. Un sanctuaire numérique.*

---

## Déploiement sur Render

### Prérequis

- Compte [Render](https://render.com)
- Repo Git (GitHub, GitLab, ou Bitbucket)
- Node.js ≥ 18 en local pour tester

---

### 1. Préparer le repo

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/TON_USERNAME/unsite.git
git push -u origin main
```

---

### 2. Déployer via Blueprint (recommandé)

Le fichier `render.yaml` à la racine configure **tout automatiquement** :
le service web + les 5 cron jobs.

1. Aller sur [render.com/dashboard](https://render.com/dashboard)
2. Cliquer **New → Blueprint**
3. Connecter votre repo GitHub/GitLab
4. Render détecte `render.yaml` et crée tous les services
5. Confirmer — c'est tout.

Render génère automatiquement `CRON_SECRET` (valeur aléatoire sécurisée).

---

### 3. Déployer manuellement (alternatif)

Si vous ne voulez pas utiliser Blueprint :

#### Service Web

| Champ            | Valeur                        |
|------------------|-------------------------------|
| **Type**         | Web Service                   |
| **Runtime**      | Node                          |
| **Region**       | Frankfurt (EU)                |
| **Build Command**| `npm ci && npm run build`     |
| **Start Command**| `npm start`                   |
| **Plan**         | Starter ($7/mois)             |
| **Health Check** | `/api/health`                 |

#### Variables d'environnement à ajouter

| Variable               | Valeur                                      |
|------------------------|---------------------------------------------|
| `NODE_ENV`             | `production`                                |
| `PORT`                 | `3000`                                      |
| `CRON_SECRET`          | *(générer avec `openssl rand -hex 32`)*     |
| `NEXT_PUBLIC_SITE_URL` | `https://unsite.onrender.com` *(votre URL)* |

#### Cron Jobs (1 par job)

Pour chaque job, créer un **Cron Job** sur Render :

| Nom                     | Schedule        | Commande                                                                 |
|-------------------------|-----------------|--------------------------------------------------------------------------|
| `unsite-cron-heartbeat` | `* * * * *`     | `curl -sf -H "Authorization: Bearer $CRON_SECRET" $SITE_URL/api/cron?job=heartbeat` |
| `unsite-cron-cleanup`   | `*/5 * * * *`   | `curl -sf -H "Authorization: Bearer $CRON_SECRET" $SITE_URL/api/cron?job=cleanup`   |
| `unsite-cron-mood`      | `*/15 * * * *`  | `curl -sf -H "Authorization: Bearer $CRON_SECRET" $SITE_URL/api/cron?job=mood`      |
| `unsite-cron-stats`     | `0 * * * *`     | `curl -sf -H "Authorization: Bearer $CRON_SECRET" $SITE_URL/api/cron?job=stats`     |
| `unsite-cron-prune`     | `0 0 * * *`     | `curl -sf -H "Authorization: Bearer $CRON_SECRET" $SITE_URL/api/cron?job=prune-drawings` |

Ajouter les variables `CRON_SECRET` et `SITE_URL` sur chaque cron job.

---

### 4. Domaine personnalisé

Dans Render → votre service → **Settings → Custom Domains** :
1. Ajouter `unsite.world` (ou votre domaine)
2. Copier le CNAME fourni par Render
3. L'ajouter chez votre registrar (Cloudflare, OVH, Namecheap…)
4. Mettre à jour `NEXT_PUBLIC_SITE_URL` avec le vrai domaine
5. Mettre à jour `public/sitemap.xml` avec le vrai domaine

---

### 5. Dashboard cron

Accéder à `/cron` sur votre site déployé.
Mot de passe = valeur de `CRON_SECRET`.

---

### 6. Tester les crons en local

```bash
# Lancer le serveur
npm run dev

# Dans un autre terminal
export CRON_SECRET=dev-secret-local

# Tous les jobs
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron

# Un seul job
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron?job=cleanup
```

---

### Structure du projet

```
unsite/
├── render.yaml                     ← Blueprint Render (IaC)
├── next.config.ts                  ← Config Next.js (standalone + headers)
├── package.json
├── tsconfig.json
├── .env.example                    ← Variables à configurer
├── .gitignore
├── public/
│   ├── robots.txt                  ← SEO + blocage scrapers IA
│   └── sitemap.xml                 ← Sitemap (1 seule URL)
└── src/app/
    ├── layout.tsx                  ← Metadata, viewport
    ├── page.tsx                    ← L'expérience Unsite
    ├── cron/
    │   └── page.tsx                ← Dashboard /cron (protégé)
    └── api/
        ├── health/route.ts         ← GET /api/health (healthcheck Render)
        └── cron/route.ts           ← GET|POST /api/cron (jobs)
```

---

### Notes importantes

- **`output: 'standalone'`** dans `next.config.ts` — requis pour Render Node.
- **`npm start`** utilise `$PORT` — Render injecte automatiquement le port.
- Le plan **Starter** met le service en veille après 15 min d'inactivité. Passer en **Standard** ($25/mois) pour éviter ça.
- `CRON_SECRET` généré par Blueprint est stocké dans les secrets Render — jamais exposé dans les logs.

---

*Le site résiste à la viralité. Il résiste à l'optimisation. Il encourage la présence.*
