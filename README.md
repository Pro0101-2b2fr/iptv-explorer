# 📺 IPTV Explorer

Explorez et regardez des milliers de chaînes TV du monde entier, propulsé par [iptv-org](https://github.com/iptv-org/iptv).

## Features

- **Navigation par pays** — Parcourez les chaînes disponibles dans chaque pays
- **Recherche** — Trouvez une chaîne par son nom
- **Filtres par catégorie** — Filtrez par genre (news, sports, music, etc.)
- **Lecteur HLS** — Regardez les flux .m3u8 directement dans le navigateur
- **Design moderne** — Interface sombre avec accents rouges

## Stack

- [Next.js 15](https://nextjs.org/) — App Router, React Server Components
- [Tailwind CSS v4](https://tailwindcss.com/) — Styling
- [HLS.js](https://github.com/video-dev/hls.js) — Lecture des flux HLS
- [iptv-org API](https://iptv-org.github.io/api/) — Données des chaînes

## Développement

```bash
npm install
npm run dev
```

## Déploiement

Déployé sur [Vercel](https://vercel.com) avec ISR (revalidation quotidienne).

## Licence

MIT — Données fournies par [iptv-org/iptv](https://github.com/iptv-org/iptv) (Unlicense).
