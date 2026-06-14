export type GeneralCourt = {
  courtNumber: number;
  searchId: string;
};

// The site's general-court refiner labels the active session "<n><suffix> (Current)",
// e.g. "194th (Current)". The searchId is just the hex encoding of that label.
const CURRENT_LABEL_SUFFIX = ' (Current)';

// st/nd/rd/th for an arbitrary positive integer.
function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return 'th';
  }
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function searchIdForCurrentCourt(courtNumber: number): string {
  const label = `${courtNumber}${ordinalSuffix(courtNumber)}${CURRENT_LABEL_SUFFIX}`;
  return Buffer.from(label, 'utf8').toString('hex');
}

// A new General Court convenes every 2 years on odd years:
// 191st=2019, 192nd=2021, 193rd=2023, 194th=2025, ...
export function courtNumberForYear(year: number): number {
  return 191 + Math.floor((year - 2019) / 2);
}

export function getLegislature(courtNumber: number): GeneralCourt {
  return {
    courtNumber,
    searchId: searchIdForCurrentCourt(courtNumber)
  };
}

export function getCurrentLegislature(): GeneralCourt {
  return getLegislature(courtNumberForYear(new Date().getFullYear()));
}
