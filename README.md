# 🎵 Poweramp Stream

Stream toutes les musiques de Spotify directement dans **Poweramp** sans rien télécharger.
L'audio est résolu depuis YouTube en temps réel, tu gardes tout le DSP/EQ/Hi-Res de Poweramp.

## Comment ça marche

```
Spotify API (métadonnées, playlists, pochettes)
        ↓
  Backend Node.js  →  YouTube (résolution audio sans téléchargement)
        ↓
   Poweramp Android (DSP, EQ 10 bandes, Hi-Res, Gapless...)
```

---

## 🚀 Déploiement du Backend (Pterodactyl / Container Python)

> Ton container Pterodactyl tourne Python mais Node.js peut s'y installer facilement.

### Étape 1 — Récupérer le code

```bash
git clone https://github.com/theo7791l/poweramp-stream.git
cd poweramp-stream/backend
```

### Étape 2 — Installer Node.js (si pas déjà présent)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### Étape 3 — Configurer les variables d'environnement

```bash
cp ../.env.example .env
nano .env
```

Remplis le fichier `.env` :

```env
SPOTIFY_CLIENT_ID=5026c53ef8e643f0b8d2f048e54aceca
SPOTIFY_CLIENT_SECRET=TON_NOUVEAU_SECRET_ICI
PORT=ton_port_pterodactyl
```

> ⚠️ Remplace `TON_NOUVEAU_SECRET_ICI` par le secret régénéré sur https://developer.spotify.com/dashboard

### Étape 4 — Lancer

```bash
bash start.sh
```

Le backend tourne sur `http://TON_IP:TON_PORT`

---

## 📡 Endpoints disponibles

| Endpoint | Description |
|---|---|
| `GET /health` | Vérifier que le backend tourne |
| `GET /spotify/search?q=query` | Chercher des tracks Spotify |
| `GET /spotify/track/:id` | Détails d'une track |
| `GET /spotify/playlist/:id` | Tracks d'une playlist |
| `GET /spotify/album/:id` | Tracks d'un album |
| `GET /spotify/artist/:id/top` | Top tracks d'un artiste |
| `GET /stream/resolve/:trackId` | Résoudre l'URL audio YouTube |
| `GET /stream/proxy/:trackId` | **Proxy audio direct** (pour Poweramp) |
| `GET /stream/query?q=query` | Résoudre par recherche texte |

---

## 📱 App Android (Partie 2 — À venir)

L'app Android `PowerampStreamProvider` expose le backend à Poweramp via la **Track Provider API**.
Elle apparaîtra directement dans les sources de Poweramp, comme un dossier local.

Installation : télécharger le `.apk` dans les [Releases](https://github.com/theo7791l/poweramp-stream/releases).

---

## 🔧 Configuration Poweramp

1. Ouvrir Poweramp → **Bibliothèque** → **Dossiers et Bibliothèque**
2. Tu verras **Poweramp Stream** apparaître comme source
3. Activer la source → **Scanner**
4. Toutes tes playlists Spotify apparaissent avec l'interface Poweramp normale

---

## 📦 Stack technique

- **Backend** : Node.js + TypeScript + Express
- **Résolution audio** : `youtubei.js` (YouTube sans clé API, sans yt-dlp)
- **Métadonnées** : Spotify Web API
- **App Android** : Kotlin + Poweramp Track Provider API
