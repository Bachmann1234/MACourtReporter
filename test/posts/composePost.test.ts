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

test('Stays within 300 graphemes when the body lands exactly on the budget boundary', () => {
  // Regression: the un-truncated branch once reserved only one of the two spaces
  // in "<body> <url> <hash>", so a body sized exactly to the budget produced a
  // 301-grapheme post that Bluesky rejects. Walk a range of summary lengths that
  // brackets the boundary and assert none exceed the limit.
  const url = 'https://malegislature.gov/Bills/194/H1';
  for (let pad = 250; pad <= 260; pad++) {
    const bill: ComposableBill = {
      filedBy: 'Somebody',
      billNumber: 'H.1',
      summary: 'x'.repeat(pad),
      url
    };
    expect(composePostText(bill).length).toBeLessThanOrEqual(300);
  }
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
