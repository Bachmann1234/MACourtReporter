import {
  chamberSearchId,
  courtNumberForYear,
  getCurrentLegislature,
  getLegislature
} from '../../src/legislature/generalCourt';

// The site's refiner tokens are the hex encoding of a human-readable label, so a
// round-trip decode is the clearest way to assert what we'd send it.
function decode(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf8');
}

test('Derives the court number from the year (new court every odd year)', () => {
  // 191st convened 2019; a fresh court every two years thereafter.
  expect(courtNumberForYear(2019)).toBe(191);
  expect(courtNumberForYear(2020)).toBe(191);
  expect(courtNumberForYear(2021)).toBe(192);
  expect(courtNumberForYear(2024)).toBe(193);
  expect(courtNumberForYear(2025)).toBe(194);
  expect(courtNumberForYear(2026)).toBe(194);
  expect(courtNumberForYear(2027)).toBe(195);
});

test('Builds the current-court searchId as the hex of "<n><ordinal> (Current)"', () => {
  expect(decode(getLegislature(194).searchId)).toBe('194th (Current)');
  expect(decode(getLegislature(191).searchId)).toBe('191st (Current)');
  expect(decode(getLegislature(192).searchId)).toBe('192nd (Current)');
  expect(decode(getLegislature(193).searchId)).toBe('193rd (Current)');
});

test('Ordinal suffix handles the 11/12/13 exception', () => {
  // The 211th–213th would convene well beyond our lifetimes, but the suffix rule
  // still has to get these right rather than emitting "211st".
  expect(decode(getLegislature(211).searchId)).toBe('211th (Current)');
  expect(decode(getLegislature(212).searchId)).toBe('212th (Current)');
  expect(decode(getLegislature(213).searchId)).toBe('213th (Current)');
});

test('Chamber searchIds are the hex of the chamber name', () => {
  expect(decode(chamberSearchId('House'))).toBe('House');
  expect(decode(chamberSearchId('Senate'))).toBe('Senate');
});

test('getCurrentLegislature agrees with the year-derived court number', () => {
  expect(getCurrentLegislature().courtNumber).toBe(courtNumberForYear(new Date().getFullYear()));
});
