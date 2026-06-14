import { load as cheerioLoad } from 'cheerio';
import Pino from 'pino';
import type { GeneralCourt } from '../legislature/generalCourt';

const ROOT_PAGE = 'https://malegislature.gov';

const logger = Pino();

export type ScrapedBill = {
  billNumber: string;
  summary: string;
  filedBy: string;
  url: string;
};

export function validatePotentialBill(bill: ScrapedBill): void {
  // Apparently filedby can be null. Who woulda knew?
  if (
    !(bill.billNumber && bill.summary && bill.url && bill.billNumber.match(/(H|HD|SD|S)\.\d+/g))
  ) {
    logger.error({ bill }, 'Extracted malformed bill');
    throw Error('Bill looks strange');
  }
}

export function findBillsInSearchPage(pageHtml: string): ScrapedBill[] {
  const $ = cheerioLoad(pageHtml);
  return $('#searchTable tbody tr')
    .map((_i, elem) => {
      const [, billNumber, filedBy, summary] = $(elem).find('td').toArray();
      const billNumberElement = $(billNumber);
      // The summary cell now holds the bill title in an <a> plus a <p> body
      // preview. We want the title only; fall back to the cell text if there's
      // no anchor.
      const summaryElement = $(summary);
      const summaryTitle = summaryElement.find('a');
      const bill = {
        billNumber: billNumberElement.text().trim(),
        summary: (summaryTitle.length ? summaryTitle.text() : summaryElement.text()).trim(),
        filedBy: $(filedBy).text().trim(),
        url: `${ROOT_PAGE}${billNumberElement.find('a')[0].attribs.href}`
      };
      validatePotentialBill(bill);
      return bill;
    })
    .get();
}

export async function queryRecentBills(legislature: GeneralCourt): Promise<ScrapedBill[]> {
  const courtUrl = `${ROOT_PAGE}/Bills/Search?SearchTerms=&Page=1&Refinements%5Blawsgeneralcourt%5D=${legislature.searchId}&SortManagedProperty=lawsbillnumber&Direction=desc`;
  const response = await fetch(courtUrl);
  if (!response.ok) {
    throw Error(`Search request failed: ${response.status} ${response.statusText}`);
  }
  const bills = findBillsInSearchPage(await response.text());
  if (bills.length === 0) {
    // Zero results almost always means our "(Current)" derivation went stale at
    // a session rollover, not that the court filed nothing. Surface it loudly
    // rather than silently posting nothing. (See ticket #008 for alerting.)
    logger.warn(
      { courtNumber: legislature.courtNumber, searchId: legislature.searchId, courtUrl },
      'Bill search returned zero results — current legislature derivation may be stale'
    );
  }
  return bills;
}
