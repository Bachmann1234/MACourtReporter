import Anthropic from '@anthropic-ai/sdk';
import Pino from 'pino';
import { fetchBillText } from '../clients/malegislature';

const logger = Pino();

// The reply shares the main post's 300-grapheme Bluesky budget. Bill summaries
// are ASCII plus the occasional en/em dash (all single code units), so string
// length tracks the grapheme count closely enough to gate on — and a few chars
// of headroom never hurts. An over-length summary is dropped, not truncated.
const MAX_SUMMARY_LENGTH = 300;

// Sonnet 4.6 was chosen in #015 (marginally more accurate than Haiku at trivial
// extra cost for a trust-sensitive civic bot). Overridable for the Haiku fallback.
const SUMMARY_MODEL = process.env.SUMMARY_MODEL ?? 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are the summary step of a civic Bluesky bot (@MACourtReporter) that announces newly filed Massachusetts bills. The bot ALREADY posts a main post containing the sponsor, bill number, and the bill's official title. You decide whether to add a SECOND post (a reply) that explains the bill in plain English — but ONLY when it genuinely adds value beyond what the official title already conveys.

Decision rule — reply ONLY if at least one is true:
- The official title is vague, generic, or procedural and doesn't convey what the bill actually does.
- The title is long enough that it was likely truncated in the main post, hiding key substance.
- The bill's real effect, mechanism, or stakes aren't obvious from the title alone (e.g. dollar terms, who is affected, a notable condition, or undefined jargon/acronyms).
Do NOT reply if the title already fully tells a layperson what the bill does — a summary that merely restates the title is noise. Be willing to skip; skipping is the right call often.

When you DO reply, the summary must be:
- Plain, neutral, factual. No spin, opinion, hype, or emoji.
- 300 characters MAX. 1-3 sentences. Explain the real-world effect, do not restate the title.
- Grounded ONLY in the provided bill text. If the text is just boilerplate/preamble with no substance (common for large appropriations bills), do not invent specifics — skip instead.
- No bill number, no hashtag (the parent post already has those).

Respond with a JSON object: set "reply" to true and "summary" to the reply text when a summary adds value; otherwise set "reply" to false and "summary" to an empty string.`;

const DECISION_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'boolean' },
    summary: { type: 'string' }
  },
  required: ['reply', 'summary'],
  additionalProperties: false
} as const;

export type SummaryDecision = { reply: false } | { reply: true; text: string };

type SummarizableBill = { billNumber: string; summary: string; url: string };

function parseDecision(text: string): SummaryDecision {
  let parsed: { reply?: unknown; summary?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    return { reply: false };
  }
  if (parsed.reply !== true || typeof parsed.summary !== 'string') {
    return { reply: false };
  }
  const summary = parsed.summary.trim();
  // Guard the budget ourselves — JSON schema can't express maxLength, and a
  // summary that overruns 300 graphemes would be rejected or truncated by the
  // poster. Drop it rather than post something malformed.
  if (!summary || summary.length > MAX_SUMMARY_LENGTH) {
    return { reply: false };
  }
  return { reply: true, text: summary };
}

// Ask the model whether a plain-English reply is warranted and, if so, for the
// text. One call does decide-then-write. May throw (API error, malformed output)
// — callers degrade via maybeBuildReply.
export async function summarizeBill(
  bill: SummarizableBill,
  billText: string,
  client: Anthropic
): Promise<SummaryDecision> {
  const message = await client.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Official title: ${bill.summary}\n\nBill text:\n${billText}`
      }
    ],
    output_config: { format: { type: 'json_schema', schema: DECISION_SCHEMA } }
  });
  const textBlock = message.content.find((block) => block.type === 'text');
  if (textBlock?.type !== 'text') {
    return { reply: false };
  }
  return parseDecision(textBlock.text);
}

type ReplyDeps = {
  client?: Anthropic;
  fetchText?: (billNumber: string, billUrl: string) => Promise<string>;
};

// Best-effort entry point used by the posting flow: returns a reply decision and
// NEVER throws. Off unless ANTHROPIC_API_KEY is set; any failure (text fetch,
// API, bad output) degrades to "no reply" so the main post is never blocked.
export async function maybeBuildReply(
  bill: SummarizableBill,
  deps: ReplyDeps = {}
): Promise<SummaryDecision> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { reply: false };
  }
  try {
    const fetchText = deps.fetchText ?? fetchBillText;
    const billText = await fetchText(bill.billNumber, bill.url);
    if (!billText) {
      return { reply: false };
    }
    const client = deps.client ?? new Anthropic({ timeout: 30_000, maxRetries: 1 });
    return await summarizeBill(bill, billText, client);
  } catch (error) {
    logger.warn({ err: error, billNumber: bill.billNumber }, 'Summary reply skipped (best-effort)');
    return { reply: false };
  }
}
