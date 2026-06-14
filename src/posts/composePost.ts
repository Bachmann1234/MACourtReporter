// Composes the text of a post from a bill. Ticket #010 decided on the
// deterministic format (the official bill title is the source of truth — no LLM
// paraphrase for a civic bot). Bluesky allows 300 graphemes; the bill URL is
// shown in full (Bluesky does not shorten links) and counts toward the limit, so
// we reserve its full length. Bill text is ASCII, so JS string length equals the
// grapheme count here; postBill still relies on RichText if that ever changes.
const MAX_POST_LENGTH = 300;
const MA_POLI_HASH = '#mapoli';

export type ComposableBill = {
  billNumber: string;
  filedBy: string;
  summary: string;
  url: string;
};

export function composePostText(bill: ComposableBill): string {
  const spaceForPost = MAX_POST_LENGTH - MA_POLI_HASH.length - ' '.length - bill.url.length;
  const proposedBody = `${bill.filedBy || 'Somebody'} filed: ${bill.billNumber} - ${bill.summary}`;
  if (proposedBody.length > spaceForPost) {
    return `${proposedBody.substring(0, spaceForPost - 4)}... ${bill.url} ${MA_POLI_HASH}`;
  }
  return `${proposedBody} ${bill.url} ${MA_POLI_HASH}`;
}
