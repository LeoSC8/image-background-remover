# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Image background remover - an online AI-powered tool for removing backgrounds from images. Built with Next.js 15, React 18, deployed on Cloudflare Workers via OpenNext.

Target users: E-commerce sellers, designers, content creators, personal users.

## Development Commands

```bash
# Start development server
npm run dev

# Build Next.js only
npm run build:next

# Build Cloudflare Worker only
npm run build:worker

# Build all (Next.js + Worker)
npm run build

# Start production server
npm start
```

## Architecture

**Server-side processing**: Background removal uses the remove.bg API. Image processing requests are sent to the API and results returned to the client.

**Single-page app**: Main UI in `app/page.tsx` with client-side state management (useState). Upload → Process → Download flow.

**Deployment**: Cloudflare Workers via @opennextjs/cloudflare. CI/CD through GitHub Actions (`.github/workflows/deploy.yml`).

**File constraints**:
- Formats: JPG, PNG, WEBP only
- Max size: 10MB
- Max resolution: 4K (4096×4096)

**Upload methods**: Drag-and-drop, click to select, paste (Ctrl+V)

## Key Implementation Details

The app uses Next.js App Router with client components ("use client"). Background removal is triggered immediately on file upload - no separate "process" button. Results display side-by-side comparison with checkered background pattern for transparency visualization.

Language: UI text is mixed Chinese/English (Chinese for alerts/labels, English for main headings).
