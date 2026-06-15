import { load as cheerioLoad } from 'cheerio';
import Pino from 'pino';
import {
  CHAMBERS,
  type Chamber,
  chamberSearchId,
  type GeneralCourt
} from '../legislature/generalCourt';

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
  if (!(bill.billNumber && bill.summary && bill.url && bill.billNumber.match(/(H|HD|SD|S)\.\d+/))) {
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
      // Pull the link via attr() rather than indexing the DOM node directly: a
      // row missing the expected cell/anchor yields undefined here instead of a
      // raw TypeError, so validatePotentialBill can fail with a clean message.
      const href = billNumberElement.find('a').attr('href');
      const bill = {
        billNumber: billNumberElement.text().trim(),
        summary: (summaryTitle.length ? summaryTitle.text() : summaryElement.text()).trim(),
        filedBy: $(filedBy).text().trim(),
        url: href ? `${ROOT_PAGE}${href}` : ''
      };
      validatePotentialBill(bill);
      return bill;
    })
    .get();
}

// The bill-text page ends with a fixed site-wide disclaimer ("The information
// contained in this website is for general information purposes only...") and
// opens with a "× Bill <num>" close-button/header. Neither is bill content, so
// we trim both to hand the summarizer just the legislative text (#015).
const TEXT_BOILERPLATE_MARKER = 'The information contained in this website';
const TEXT_HEADER_CHROME = /^×\s*Bill\s+\S+\s*/;

// House bills are H./HD., Senate bills S./SD. — the bill-text URL is segmented by
// the chamber name, so we derive it from the prefix (validatePotentialBill has
// already guaranteed the number matches /(H|HD|SD|S)\.\d+/).
export function chamberForBillNumber(billNumber: string): Chamber {
  return billNumber.startsWith('S') ? 'Senate' : 'House';
}

// Pull the legislative body out of a bill-text page: collapse whitespace, drop
// the leading chrome, and cut everything from the site disclaimer onward.
export function extractBillText(pageHtml: string): string {
  const $ = cheerioLoad(pageHtml);
  $('script, style').remove();
  const raw = $('.modalContent, main, body').first().text().replace(/\s+/g, ' ').trim();
  const disclaimerAt = raw.indexOf(TEXT_BOILERPLATE_MARKER);
  const body = disclaimerAt >= 0 ? raw.slice(0, disclaimerAt) : raw;
  return body.replace(TEXT_HEADER_CHROME, '').trim();
}

// Fetch and clean the full text of a single bill. The bill's own URL plus
// `/<Chamber>/Bill/Text` is the printable-text view. Throws on a failed request
// so the caller can degrade gracefully (the summary reply is best-effort, #015).
export async function fetchBillText(billNumber: string, billUrl: string): Promise<string> {
  const chamber = chamberForBillNumber(billNumber);
  const response = await fetch(`${billUrl}/${chamber}/Bill/Text`);
  if (!response.ok) {
    throw Error(`Bill text request failed: ${response.status} ${response.statusText}`);
  }
  return extractBillText(await response.text());
}

// Page 1 of the recent-bills search for a single chamber. The search sorts by
// bill number desc across the whole court; since the House files far more bills
// than the Senate, an unrefined search never surfaces a single Senate bill (see
// ticket #013). Refining by chamber gives each its own page-1 of recent filings.
export async function queryRecentBillsForChamber(
  legislature: GeneralCourt,
  chamber: Chamber
): Promise<ScrapedBill[]> {
  const courtUrl = `${ROOT_PAGE}/Bills/Search?SearchTerms=&Page=1&Refinements%5Blawsgeneralcourt%5D=${legislature.searchId}&Refinements%5Blawsbranchname%5D=${chamberSearchId(chamber)}&SortManagedProperty=lawsbillnumber&Direction=desc`;
  const response = await fetch(courtUrl);
  if (!response.ok) {
    throw Error(`Search request failed: ${response.status} ${response.statusText}`);
  }
  const bills = findBillsInSearchPage(await response.text());
  if (bills.length === 0) {
    // Zero results almost always means our "(Current)" derivation went stale at
    // a session rollover, not that the chamber filed nothing. Surface it loudly
    // rather than silently posting nothing. (See ticket #008 for alerting.)
    logger.warn(
      { courtNumber: legislature.courtNumber, searchId: legislature.searchId, chamber, courtUrl },
      'Bill search returned zero results — current legislature derivation may be stale'
    );
  }
  return bills;
}

// Recent bills across both chambers, merged. Each chamber is scraped separately
// because a combined search is dominated by the higher-volume House (#013).
export async function queryRecentBills(legislature: GeneralCourt): Promise<ScrapedBill[]> {
  const perChamber = await Promise.all(
    CHAMBERS.map((chamber) => queryRecentBillsForChamber(legislature, chamber))
  );
  return perChamber.flat();
}
