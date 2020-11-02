import axios from 'axios';
import cheerio from 'cheerio';
import { GeneralCourt } from '../legislature/generalCourt';

const ROOT_PAGE = 'https://malegislature.gov';

export type ScrapedBill = {
  billNumber: string;
  summary: string;
  filedBy: String;
  url: String;
};

export function findBillsInSearchPage(pageHtml: string): ScrapedBill[] {
  const $ = cheerio.load(pageHtml);
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

export async function queryRecentBills(legislature: GeneralCourt): Promise<ScrapedBill[]> {
  const courtUrl = `${ROOT_PAGE}/Bills/Search?SearchTerms=&Page=1&Refinements%5Blawsgeneralcourt%5D=${legislature.searchId}&SortManagedProperty=lawsbillnumber&Direction=desc`;
  const response = await axios.get(courtUrl);
  return findBillsInSearchPage(response.data);
}
