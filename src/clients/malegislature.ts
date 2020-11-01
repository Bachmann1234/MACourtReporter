import axios, { AxiosResponse } from 'axios';
import Pino from 'pino';
import cheerio from 'cheerio';
import { GeneralCourt } from '../legislature/generalCourt';

const logger = Pino();

const ROOT_PAGE = 'https://malegislature.gov';

export type ScrapedBill = {
  billNumber: string;
  summary: string;
  filedBy: String;
  url: String;
};

function processSearchPage(response: AxiosResponse): ScrapedBill[] {
  const $ = cheerio.load(response.data);
  return $('#searchTable tbody tr')
    .map((i, elem) => {
      const [, billNumber, filedBy, summary] = $(elem).find('td').toArray();
      const billNumberElement = $(billNumber);
      return {
        billNumber: billNumberElement.text().trim(),
        summary: $(summary).text().trim(),
        filedBy: $(filedBy).text().trim(),
        url: `${ROOT_PAGE}${billNumberElement.find('a')[0].attribs.href}`
      };
    })
    .get();
}

export async function queryRecentBills(legislature: GeneralCourt): Promise<void> {
  const courtUrl = `${ROOT_PAGE}/Bills/Search?SearchTerms=&Page=1&Refinements%5Blawsgeneralcourt%5D=${legislature.searchId}&SortManagedProperty=lawsbillnumber&Direction=desc`;
  logger.info(`Querying for recent bills from MA General Court ${legislature.courtNumber}`);
  try {
    const response = await axios.get(courtUrl);
    processSearchPage(response).forEach((bill) => {
      logger.info(
        `${bill.billNumber}: ${bill.summary}. Filed by: ${bill.filedBy}. Learn more: ${bill.url}`
      );
    });
  } catch (error) {
    logger.error(error);
  }
}
