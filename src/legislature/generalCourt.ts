export type GeneralCourt = {
  courtNumber: number;
  searchId: string;
};

export const maGeneralCourts: { [index: string]: GeneralCourt } = {
  '191': {
    courtNumber: 191,
    searchId: '3139317374202843757272656e7429'
  }
};

export function getLegislature(number: number) {
  return maGeneralCourts[number.toString()];
}

export function getCurrentLegislature() {
  return getLegislature(191);
}
