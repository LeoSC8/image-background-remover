# Image Background Remover

A minimal online tool to remove image backgrounds automatically.

## Features

- Upload images (JPG, PNG, WebP)
- Automatic background removal
- Download transparent PNG
- White background option
- No registration required

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your remove.bg API key to `.env`:
```
REMOVE_BG_API_KEY=your_api_key_here
```

Get your API key from: https://remove.bg/api

4. Run development server:
```bash
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- remove.bg API
