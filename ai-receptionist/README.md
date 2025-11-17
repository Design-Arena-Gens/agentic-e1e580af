## Agentic AI Receptionist

This project delivers a full-stack AI receptionist that captures inbound calls, triages caller intent, and manages the booking calendar. It is built with Next.js App Router and is deployable to Vercel.

### Features

- Live call console with human-friendly transcripts and AI responses
- Automatic booking creation and status updates from the AI flow
- Manual booking form for front-desk agents
- File-backed schedule store for local development with seed data
- OpenAI-powered assistant with structured JSON actions (with a deterministic fallback when `OPENAI_API_KEY` is not set)

### Prerequisites

- Node.js 18+ (or the version required by the `engines` field in `package.json`)
- An OpenAI API key (optional, enables the LLM-driven receptionist)

Create a `.env.local` file to expose your key locally:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Without these variables, the assistant falls back to scripted responses and skips auto-booking.

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 to interact with the receptionist console.

### Production Build

```bash
npm run build
npm start
```

### API Surface

- `POST /api/assistant` — accepts the live call transcript and returns the AI's reply plus any booking actions performed.
- `GET/POST /api/bookings` — list or create bookings.
- `PATCH /api/bookings/:id` — update booking status.

The file-based datastore writes to the platform's temporary directory by default (`os.tmpdir()`), keeping the solution compatible with Vercel's serverless runtime.
