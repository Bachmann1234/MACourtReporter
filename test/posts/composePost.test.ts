import { type ComposableBill, composePostText } from '../../src/posts/composePost';

test('Constructs post text from a bill', () => {
  const bill: ComposableBill = {
    filedBy: 'Bill',
    summary: 'Wow! What a bill.',
    billNumber: 'H.1201',
    url: 'https://example.com'
  };
  expect(composePostText(bill)).toEqual(
    'Bill filed: H.1201 - Wow! What a bill. https://example.com #mapoli'
  );
});

test('Can handle a bill with no filer', () => {
  const bill: ComposableBill = {
    filedBy: '',
    summary: 'Wow! What a bill.',
    billNumber: 'H.1201',
    url: 'https://example.com'
  };
  expect(composePostText(bill)).toEqual(
    'Somebody filed: H.1201 - Wow! What a bill. https://example.com #mapoli'
  );
});

test('Will shorten an over-long summary to fit the 300-grapheme limit', () => {
  const bill: ComposableBill = {
    summary: `An Act ${'relative to municipal governance and public accountability '.repeat(10)}`,
    filedBy: 'Bach',
    billNumber: 'H.1201',
    url: 'https://malegislature.gov/Bills/194/H1201'
  };
  const text = composePostText(bill);
  // ASCII text, so string length equals the grapheme count Bluesky enforces.
  expect(text.length).toBeLessThanOrEqual(300);
  expect(text.startsWith('Bach filed: H.1201 - An Act relative to municipal')).toBe(true);
  expect(text.endsWith('... https://malegislature.gov/Bills/194/H1201 #mapoli')).toBe(true);
});
