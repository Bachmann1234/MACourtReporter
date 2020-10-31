import axios, { AxiosResponse } from 'axios';
import Pino from 'pino';
import { GeneralCourt } from '../legislature/generalCourt';

const logger = Pino();

export type ScrapedBill = {
  billNumber: string;
  summary: string;
  filedBy: String;
};

function processSearchPage(response: AxiosResponse): ScrapedBill[] {
  return [{ billNumber: '', summary: '', filedBy: '' }];
}

export async function queryRecentBills(legislature: GeneralCourt): Promise<void> {
  const courtUrl = `https://malegislature.gov/Bills/Search?SearchTerms=&Page=1&Refinements%5Blawsgeneralcourt%5D=${legislature.searchId}&SortManagedProperty=lawsbillnumber&Direction=desc`;
  logger.info(`Querying for recent bills from MA General Court ${legislature.courtNumber}`);
  try {
    const response = await axios.get(courtUrl);
    processSearchPage(response).forEach((bill) => {
      logger.info(`${bill.billNumber}: ${bill.summary} filed by ${bill.filedBy}`);
    });
  } catch (error) {
    logger.error(error);
  }
}
