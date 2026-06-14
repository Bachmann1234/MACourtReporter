// Composes the text of a post from a bill. Length math and the move to
// Bluesky's 300-grapheme limit are revisited in ticket #010; this preserves the
// existing deterministic formatting unchanged.
const MAX_POST_LENGTH = 280;
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
