# German / Italian Learner Research

A small research prototype that runs a 5–10 minute conversational **voice interview** with real
language learners to discover the problems people face learning German or Italian.

The interview is driven by an AI interviewer (Gemini, with Groq as an automatic fallback), spoken
and answered by voice, with a text fallback always available. Completed interviews produce a
structured research summary you can review in a protected admin dashboard.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**
- **Supabase (PostgreSQL)** — interviews & transcripts
- **Gemini API** (primary) — interviewer LLM, speech-to-text, text-to-speech
- **Groq API** (automatic fallback) — keeps the interview running if Gemini fails
- Deploy target: **Vercel**

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your `.env.local` from the template:

   ```bash
   cp .env.local.example .env.local
   ```

   Set the values:

   | Variable                     | Where to get it                                             |
   | ---------------------------- | ------------------------------------------------------------ |
   | `GEMINI_API_KEY`             | Google AI Studio (aistudio.google.com)                       |
   | `GROQ_API_KEY`               | console.groq.com (optional, but recommended for fallback)    |
   | `SUPABASE_URL`               | Supabase project → Settings → API                            |
   | `SUPABASE_SERVICE_ROLE_KEY`  | Supabase project → Settings → API (service_role, server-only)|
   | `ADMIN_PASSWORD`             | Anything you choose; gates `/admin`                          |

3. Set up the database. Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.

4. Run locally:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Entry points

- **`/`** — landing page. Add `?lang=de` or `?lang=it` for the language variant
  (defaults to German). No account needed for participants.
- **`/interview`** — the voice interview itself.
- **`/admin`** — password-protected research dashboard (interviews, transcripts, AI summaries).
- **`/api/...`** — server routes; see below.

## How the interview works (turn-based voice)

1. Participant consents and starts the interview.
2. The AI interviewer asks one question at a time (spoken + on screen).
3. The participant answers by holding/pressing the microphone (or typing).
4. Audio is transcribed server-side, then:
   - the transcript is saved,
   - the interviewer model decides the next question (or a follow-up),
   - the next question is spoken via TTS.
5. Repeats until the interviewer ends or ~10 minutes elapse, then a **research summary is
   generated from the full transcript** (never from the last answer alone) and saved.

Provider fallback: every AI call (LLM, STT, TTS) tries **Gemini first**, and on failure retries
**Groq** automatically. The provider that served the call is stored on the message/interview so it
is visible in the admin dashboard.

## API routes

| Route                     | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `POST /api/interview`     | Create an interview record (`in_progress`)               |
| `POST /api/interview/ask` | Participant answer in → interviewer's next question out  |
| `POST /api/interview/finish` | Generate + save the research summary, mark completed  |
| `POST /api/stt`           | Transcribe an audio blob (multipart)                     |
| `POST /api/tts`           | Synthesize speech from text → audio                      |
| `POST /api/admin/login`   | Issue the `/admin` session cookie                        |
| `GET /api/admin/interviews` | Snow interviews + stats (admin only)                   |
| `GET /api/admin/interviews/:id` | Interview + transcript + summary (admin only)        |

## Configuration

Everything tunable lives in `src/lib/`:

- `constants.ts` — model IDs for all providers, voices, timeouts, question caps.
- `languages.ts` — the German/Italian variants (landing copy, target-language name).
- `interviewer.ts` / `summary.ts` — interviewer & summary prompts.

## Deploying to Vercel

Push the repo to GitHub and import it into Vercel, then set the same environment variables
(`GEMINI_API_KEY`, `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_PASSWORD`) in the Vercel project settings.