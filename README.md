# UglyWebSites — LLM Agent Workflow System

## Overview

This project is an AI-powered system that generates structured outputs using LLMs and renders them into production-ready web pages.

It is designed to simulate agent-style reasoning workflows using prompt engineering, schema validation, and asynchronous pipelines.

## Architecture

```
User Input
   ↓
Prompt Engineering
   ↓
LLM (OpenAI API)
   ↓
Structured JSON Output
   ↓
Schema Validation (Zod)
   ↓
Rendering Engine (Next.js)
   ↓
Published Page
```

## Tech Stack

- Node.js / TypeScript
- OpenAI API
- Next.js
- Zod (schema validation)
- PostgreSQL / SQL
- Async queue processing

## Demo

[Loom walkthrough](https://www.loom.com/share/8e5991da3693421c97c276f0ae180ed9?utm_source=chatgpt.com)

## Common commands

```bash
npm run build          # Production Next.js build
npm run worker         # Process generation_queue → pages (requires env)
npm run dev            # Local dev server
```

Deploys are typically triggered from git push to the connected Vercel project, or via `npx vercel --prod`.
