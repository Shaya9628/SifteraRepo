
# AI-Generated Screening Questions for Call Simulation

## What Changes

The Call Simulation stage (Stage 3) will generate tailored interview questions using AI based on the candidate's actual resume and department, instead of pulling generic static questions from the database. The UI will get a Gen-Z visual refresh. **No other flows are touched** -- scorecard, red flags, AI results (Stage 4), scoring, badges, progress tracking all remain exactly as they are.

## How It Works

1. User reaches Stage 3 (Call Simulation) after completing Red Flags
2. The component sends the resume text + department to a new backend function
3. AI (Gemini Flash) generates 5-8 role-specific behavioral and cultural fit questions with interviewer tips
4. Questions appear in a refreshed Gen-Z glassmorphism UI
5. If AI fails, the system silently falls back to the existing database questions (current behavior)
6. All submit/scoring/points/badges/progress logic stays identical

## Files Changed

### 1. New backend function: `supabase/functions/generate-screening-questions/index.ts`
- Accepts `{ resume_text, department }` in request body
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with tool calling to get structured output
- Returns array of questions: `{ question_text, category, hint }`
- Handles 429/402 rate limit errors gracefully
- Returns empty array on failure so frontend can fall back

### 2. `supabase/config.toml` -- add function entry
- Add `[functions.generate-screening-questions]` with `verify_jwt = true`
- (This file is auto-managed, so this will be skipped)

### 3. `src/components/CallSimulator.tsx` -- AI loading + Gen-Z UI
- Add `resumeText?: string` to props interface
- On mount, if `resumeText` is provided, call `supabase.functions.invoke('generate-screening-questions')` to fetch AI questions
- If AI succeeds, use those questions; if fails, fall back to existing DB fetch (unchanged)
- Add a "Regenerate" button to re-fetch AI questions
- Add "AI Generated" sparkle badge next to question counter
- Gen-Z styling: glassmorphism card wrapper, gradient header, neon score buttons, category toggle pills instead of dropdown
- **All submit logic, point awards, badge evaluation, progress updates remain 100% untouched**

### 4. `src/pages/Screen.tsx` -- pass resumeText prop
- Add `resumeText={resumeText}` to the `<CallSimulator>` component (line ~491)
- Single line change, nothing else modified

## What Is NOT Changed
- Scorecard (Stage 1) -- untouched
- Red Flags (Stage 2) -- untouched  
- AI Results / Analysis (Stage 4) -- untouched
- `analyze-resume` edge function -- untouched
- Assessment progress tracking -- untouched
- Points, badges, leaderboard -- untouched
- Database tables -- no schema changes needed
- All other pages and components -- untouched
