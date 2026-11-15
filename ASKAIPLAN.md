# Ask AI Plan

## Goal

Turn the **Ask** tab into an AI assistant that answers questions about the signed-in user's own clicks, such as "who did I meet at the hackathon?", and nobody else's.

## Current state

The Ask tab does not use AI yet. `askClick()` in the prototype matches keywords and regular expressions (age, hair, "today", interests) against `CLICK_DATA`, a hardcoded list of 12 made-up people. Supabase does not store any clicks yet. The only table is `profiles`.

## Key idea: look up the data on every question

There is no separate AI model per user, and no model is trained on anyone's data. Each time someone asks a question, a small backend function:

1. Checks who is asking, using their Supabase sign-in.
2. Loads only that user's clicks from Supabase.
3. Sends Claude the question along with those clicks.

The model keeps nothing between requests. Each user only ever gets answers from their own data because the database's access rules enforce it, not because the prompt asks the model to behave. That is much safer than giving the AI access to everyone's clicks and telling it to "only look at Ada's."

## Phase 1: Store real clicks in Supabase

- **New `clicks` table:**
  - `id`, and `owner_id`: the user who has the click.
  - `other_user_id`: the other person, if they are on Click.
  - `snapshot` (jsonb): the name, description, about text and socials that person shared through their preset at the moment of the click.
  - `location`, `event`, `clicked_at` and `note`.
- **Access rule:** each user can only see clicks where `owner_id` is their own user ID, the same pattern as `profiles`. A snapshot means the AI only sees what the other person actually chose to share.
- **App change:** replace `CLICK_DATA` with clicks loaded from Supabase after sign-in, the same way the profile is loaded now. Until the bracelet hardware exists, add a few test rows so Ask has something to search.

## Phase 2: A backend function that calls Claude

- **Function:** a Supabase Edge Function named `ask-clicks`, written in TypeScript and using the official `@anthropic-ai/sdk`.
- **API key:** stored as a Supabase secret. It must never be in the app, because anything bundled into the app can be pulled out of it.
- **Steps it runs:**
  1. Read the caller's sign-in token and create a Supabase client that acts as that user. The access rules then limit it to their clicks automatically. Do not use the admin (service role) key here.
  2. Load their clicks and format them compactly.
  3. Call Claude with fixed instructions (what Click is, answer only from the clicks provided, say so when nothing matches), then the clicks, then the question.
  4. Use structured output so the answer comes back as `{ text, personIds[] }`. The Ask screen already shows a reply plus tappable person cards, so the AI fits into the current UI as is.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) at `low` effort, which suits chat and keeps replies quick. Turn on Anthropic's built-in fallback setting, which automatically retries a declined request on a fallback model. Claude Haiku 5.5 (`claude-haiku-5-5`) is the cheaper option to test before launch (see **Cost**).
- **Caching:** put the instructions and the click list first and turn on prompt caching. Follow-up questions in the same chat then reuse that text at a fraction of the cost.

## Phase 3: Connect the Ask tab

Use the same bridge pattern as sign-in and profile saving:

1. The page sends `{type: 'ask', question, history}` to `App.tsx`.
2. `App.tsx` calls `supabase.functions.invoke('ask-clicks', …)`, which attaches the user's sign-in token automatically.
3. `App.tsx` passes the reply back into the chat.

Keep the current `askClick()` as an offline fallback, and keep the suggested questions.

## Phase 4: Scale up once users have lots of clicks

Sending every click with every question works up to a few hundred clicks. Beyond that, give Claude a `search_clicks` tool that filters by name, date range, place, event or text. The backend function runs those searches as the signed-in user, so the same access rule keeps applying. Claude then only reads the clicks that match, which costs less and scales to any number of clicks.

## Safety and privacy

- **Do not guess traits from photos.** The prototype's "hair color from their profile photo" feature would mean the AI judging strangers' appearance from their pictures. Limit Ask to what people actually shared about themselves.
- **Treat other people's text as data, not commands.** A bio could say "ignore your instructions…". The instructions should say the clicks are data to answer from. Ask can only read the user's own data and cannot change anything, so a trick like that cannot do much harm.
- **Limit usage per user.** For example, cap each user at N questions a day inside the function, to control cost and abuse.
- **Store chats carefully.** Saving chat history means keeping data about third parties. If chats are saved, put them in an `ask_messages` table with the same owner-only rule, and delete them when the account is deleted.
- **Test with real questions.** Collect 20–30 questions with known correct answers and check the answers before and after any change to the prompt or model.

## Cost

These are estimates. Prices come from reference data as of October 2026, so check Anthropic's pricing page before budgeting. Once `ask-clicks` is running, log the actual token usage of a few questions to check the numbers.

### What drives the cost

Each question is billed by the amount of text sent and received, measured in tokens (about ¾ of a word each):

- **Sent:** the instructions (~1,000 tokens), the user's clicks (~150 tokens each), and the question plus recent chat (~200).
- **Received:** the answer plus the model's internal reasoning, roughly 400 tokens at `low` effort. Reasoning is billed as output even though the user never sees it.

| Model | Sent | Received | Reused (cached) text |
|---|---|---|---|
| Opus 5.5 | $4.00 / 1M tokens | $20.00 / 1M | $0.20 / 1M |
| Haiku 5.5 | $0.10 / 1M | $0.50 / 1M | — |

### Cost per question

| User has… | Opus 5.5, first question | Opus 5.5, follow-up (cached) | Haiku 5.5 |
|---|---|---|---|
| 50 clicks (~9K tokens) | ~$0.04 | ~$0.01 | ~$0.001 |
| 200 clicks (~31K tokens) | ~$0.13 | ~$0.02 | ~$0.003 |

Cost grows with the number of clicks because every click is sent with every question. Phase 4 fixes that.

### Monthly estimates

Assuming each active user asks 5 questions a day, averaging about $0.03 per question on Opus and $0.001–0.003 on Haiku:

| Active users | Questions / month | Opus 5.5 | Haiku 5.5 |
|---|---|---|---|
| Team testing | a few hundred | ~$5–15 | under $1 |
| 100 | 15,000 | ~$450 | ~$15–45 |
| 1,000 | 150,000 | ~$4,500 | ~$150–450 |

Most users probably will not ask 5 questions every day, so real numbers will likely be lower.

### Recommendation

- **Build with Opus 5.5.** It is cheap while only the team is testing, and it gives the best answers to compare against.
- **Test Haiku 5.5 before launch.** Run it on the 20–30 test questions. Lookups like "who did I meet at the hackathon?" are simple, so Haiku will likely do well at about 30–40 times lower cost.
- **Set a monthly spending limit** in the Anthropic Console, alongside the per-user daily question cap, so a bug or abuse cannot run up a surprise bill.

## Build order

1. `clicks` table and access rules, plus test data.
2. Load clicks into the app in place of `CLICK_DATA`.
3. The `ask-clicks` backend function: all clicks sent with the question, structured output, caching.
4. Connect the Ask tab to the function.
5. The test questions and the per-user daily cap.
6. Later, the `search_clicks` tool once some users have hundreds of clicks.
