export type GeneralCourt = {
  courtNumber: number;
  searchId: string;
};

const maGeneralCourts = [
  {
    courtNumber: 191,
    searchId: '3139317374202843757272656e7429'
  }
];

export const CURRENT_LEGISLATURE = maGeneralCourts[maGeneralCourts.length - 1];
