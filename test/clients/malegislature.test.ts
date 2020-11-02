import { loadTextFixture } from '../fixtures/utils';
import { findBillsInSearchPage } from '../../src/clients/malegislature';

test('Extracts bills from the ma bill search page', () => {
  const page = loadTextFixture('searchPage.html');
  expect(findBillsInSearchPage(page)).toStrictEqual([
    {
      billNumber: 'H.5086',
      filedBy: 'Labor and Workforce Development (J)',
      summary:
        'An Act to prevent wage theft, promote employer accountability, and enhance public enforcement',
      url: 'https://malegislature.gov/Bills/191/H5086'
    },
    {
      billNumber: 'H.5085',
      filedBy: 'Labor and Workforce Development (J)',
      summary: 'An Act requiring one fair wage',
      url: 'https://malegislature.gov/Bills/191/H5085'
    },
    {
      billNumber: 'H.5084',
      filedBy: 'Murphy, James M.',
      summary: 'An Act relative to insurance requirements',
      url: 'https://malegislature.gov/Bills/191/H5084'
    },
    {
      billNumber: 'H.5083',
      filedBy: 'Cabral, Antonio F. D.',
      summary: 'An Act relative to polling place security and integrity',
      url: 'https://malegislature.gov/Bills/191/H5083'
    },
    {
      billNumber: 'H.5082',
      filedBy: 'Speliotis, Theodore C.',
      summary:
        'An Act authorizing the Town of Kingston to establish a Special Fund to process activity produced by Non-Town Net Metering',
      url: 'https://malegislature.gov/Bills/191/H5082'
    },
    {
      billNumber: 'H.5077',
      filedBy: 'Cusack, Mark J.',
      summary: 'An Act establishing the Tri-Town Water District',
      url: 'https://malegislature.gov/Bills/191/H5077'
    },
    {
      billNumber: 'H.5076',
      filedBy: 'Haddad, Patricia A.',
      summary: 'An Act relative to the Swansea water district elections',
      url: 'https://malegislature.gov/Bills/191/H5076'
    },
    {
      billNumber: 'H.5075',
      filedBy: 'Hogan, Kate',
      summary:
        'An Act authorizing the town of Maynard to grant one additional license for the sale of all alcoholic beverages to be consumed off the premises',
      url: 'https://malegislature.gov/Bills/191/H5075'
    },
    {
      billNumber: 'H.5074',
      filedBy: 'Public Service (J)',
      summary:
        'An Act directing the State Retirement Board to grant creditable service to Cheryl A. Bednarik',
      url: 'https://malegislature.gov/Bills/191/H5074'
    },
    {
      billNumber: 'H.5073',
      filedBy: 'Environment, Natural Resources and Agriculture (J)',
      summary: 'Study Order - Climate and Environmental Policy',
      url: 'https://malegislature.gov/Bills/191/H5073'
    },
    {
      billNumber: 'H.5072',
      filedBy: 'Environment, Natural Resources and Agriculture (J)',
      summary: 'Study Order - Pesticide and Toxic Management',
      url: 'https://malegislature.gov/Bills/191/H5072'
    },
    {
      billNumber: 'H.5071',
      filedBy: 'Environment, Natural Resources and Agriculture (J)',
      summary: 'Study Order - Animal Welfare',
      url: 'https://malegislature.gov/Bills/191/H5071'
    },
    {
      billNumber: 'H.5070',
      filedBy: 'Environment, Natural Resources and Agriculture (J)',
      summary: 'Study Order - Local Environmental Matters',
      url: 'https://malegislature.gov/Bills/191/H5070'
    },
    {
      billNumber: 'H.5069',
      filedBy: 'Boldyga, Nicholas A.',
      summary: 'An Act relative to certain civil service positions in the Agawam public schools',
      url: 'https://malegislature.gov/Bills/191/H5069'
    },
    {
      billNumber: 'H.5068',
      filedBy: 'Consumer Protection and Professional Licensure (J)',
      summary:
        'An Act authorizing the town of Dedham to grant one additional license for the sale of wine and malt to be drunk on premises',
      url: 'https://malegislature.gov/Bills/191/H5068'
    },
    {
      billNumber: 'H.5067',
      filedBy: 'Consumer Protection and Professional Licensure (J)',
      summary: 'An Act pertaining to liquor licenses in the town of Brookline',
      url: 'https://malegislature.gov/Bills/191/H5067'
    },
    {
      billNumber: 'H.5066',
      filedBy: 'Labor and Workforce Development (J)',
      summary:
        'An Act relative to additional unemployment benefits for the neediest recipients currently excluded from the Lost Wages Assistance program',
      url: 'https://malegislature.gov/Bills/191/H5066'
    },
    {
      billNumber: 'H.5065',
      filedBy: 'Baker, Charles D.',
      summary:
        'An Act making certain appropriations for fiscal year 2021 before final action on the General Appropriation Bill',
      url: 'https://malegislature.gov/Bills/191/H5065'
    },
    {
      billNumber: 'H.5064',
      filedBy: 'Hay, Stephan',
      summary:
        'An Act relative to additional unemployment benefits for the neediest recipients currently excluded from the Lost Wages Assistance program',
      url: 'https://malegislature.gov/Bills/191/H5064'
    },
    {
      billNumber: 'H.5063',
      filedBy: 'Lombardo, Marc T.',
      summary:
        'An Act establishing a sick leave bank for Brian Thompson, an employee of Department of Corrections',
      url: 'https://malegislature.gov/Bills/191/H5063'
    },
    {
      billNumber: 'H.5062',
      filedBy: 'Connolly, Mike',
      summary:
        'An Act providing for an extension of the COVID-19 eviction and foreclosure moratorium',
      url: 'https://malegislature.gov/Bills/191/H5062'
    },
    {
      billNumber: 'H.5061',
      filedBy: 'Speliotis, Theodore C.',
      summary:
        'An Act authorizing the town of Plainville to grant additional licenses for the sale of alcoholic beverages',
      url: 'https://malegislature.gov/Bills/191/H5061'
    },
    {
      billNumber: 'H.5060',
      filedBy: 'Speliotis, Theodore C.',
      summary:
        'An Act authorizing the commissioner of the Division of Capital Asset Management and Maintenance to convey and acquire certain parcels of land in the ...',
      url: 'https://malegislature.gov/Bills/191/H5060'
    },
    {
      billNumber: 'H.5059',
      filedBy: 'State Administration and Regulatory Oversight (J)',
      summary: 'An Act authorizing the sale of real property in Brockton',
      url: 'https://malegislature.gov/Bills/191/H5059'
    },
    {
      billNumber: 'H.5058',
      filedBy: 'Public Service (J)',
      summary:
        'An Act allowing Deina Abdelkader to become a member of the state employee retirement system',
      url: 'https://malegislature.gov/Bills/191/H5058'
    }
  ]);
});
