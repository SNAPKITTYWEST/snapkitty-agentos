# AgentOS Frontend

Pure HTML + CSS + JavaScript frontend for the AgentOS swarm platform.

## Tech Stack

- **HTML** — Semantic structure
- **CSS** — Pure CSS, no frameworks
- **JavaScript** — Vanilla JS, no dependencies
- **GitHub Pages** — Autonomous static hosting

## Why No Frameworks?

GitHub Pages allows any interface. We use pure web standards:
- Faster load times
- No build step required
- Zero dependencies
- Works forever

## Structure

```
agentos-frontend/
├── pages/
│   └── index.html      # Main landing page
├── css/
│   └── agentos.css     # All styles
├── js/
│   └── agentos-live.js # Live data fetcher + terminal animation
└── deploy/
    └── (GitHub Actions handles deployment)
```

## Live Data

The frontend fetches real-time status from the `.agentos` runtime via GitHub raw content URLs:
- Git bucket count from `gitbucket/index/manifest.json`
- Problem registry from `pnp/problem_registry.json`
- Skills registry from `skills/registry.json`

## Autonomous Deploy

GitHub Pages deploys automatically on push to `main` when `agentos-frontend/**` changes.

The workflow:
1. Copies `pages/index.html` → `docs/`
2. Copies `css/` and `js/` → `docs/`
3. Deploys `docs/` to `gh-pages` branch via `peaceiris/actions-gh-pages`

### Manual build

```bash
npm run build:frontend
```

### URL

After deploy: `https://snapkittywest.github.io/snapkitty-agentos/`
