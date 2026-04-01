# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Image background remover - an online AI-powered tool for removing backgrounds from images. Built with Next.js 14, React 18, and @imgly/background-removal library.

Target users: E-commerce sellers, designers, content creators, personal users.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Architecture

**Client-side processing**: Background removal runs entirely in the browser using @imgly/background-removal. No backend API - all processing happens on the client.

**Single-page app**: Main UI in `app/page.tsx` with client-side state management (useState). Upload → Process → Download flow.

**File constraints**:
- Formats: JPG, PNG, WEBP only
- Max size: 10MB
- Max resolution: 4K (4096×4096)

**Upload methods**: Drag-and-drop, click to select, paste (Ctrl+V)

## Key Implementation Details

The app uses Next.js App Router with client components ("use client"). Background removal is triggered immediately on file upload - no separate "process" button. Results display side-by-side comparison with checkered background pattern for transparency visualization.

Language: UI text is mixed Chinese/English (Chinese for alerts/labels, English for main headings).
