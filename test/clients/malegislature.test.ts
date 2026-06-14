import {
  findBillsInSearchPage,
  queryRecentBills,
  queryRecentBillsForChamber,
  validatePotentialBill
} from '../../src/clients/malegislature';
import {
  type Chamber,
  chamberSearchId,
  getCurrentLegislature
} from '../../src/legislature/generalCourt';
import loadTextFixture from '../utils/utils';

test('Extracts bills from the ma bill search page', () => {
  const page = loadTextFixture('searchPage.html');
  expect(findBillsInSearchPage(page)).toStrictEqual([
    {
      billNumber: 'H.5504',
      filedBy: 'Meschino, Joan',
      summary:
        'An Act authorizing the town of Hingham to grant to the Commonwealth of Massachusetts certain parcels of land in the town of Hingham for highway purpo...',
      url: 'https://malegislature.gov/Bills/194/H5504'
    },
    {
      billNumber: 'H.5503',
      filedBy: 'Zlotnik, Jonathan D.',
      summary:
        'An Act designating a certain bridge in the city of Gardner as the Representative Robert L. Rice, Jr. Bridge',
      url: 'https://malegislature.gov/Bills/194/H5503'
    },
    {
      billNumber: 'H.5501',
      filedBy: '',
      summary:
        'An Act making appropriations for the fiscal year 2027 for the maintenance of the departments, boards, commissions, institutions, and certain activiti...',
      url: 'https://malegislature.gov/Bills/194/H5501'
    },
    {
      billNumber: 'H.5500',
      filedBy: 'Ways and Means (H)',
      summary:
        'An Act making appropriations for the fiscal year 2027 for the maintenance of the departments, boards, commissions, institutions, and certain activiti...',
      url: 'https://malegislature.gov/Bills/194/H5500'
    },
    {
      billNumber: 'H.5499',
      filedBy: 'Williams, Bud L.',
      summary:
        "An Act to include teachers from the Springfield Empowerment Zone in the Massachusetts Teachers' Retirement System",
      url: 'https://malegislature.gov/Bills/194/H5499'
    },
    {
      billNumber: 'H.5498',
      filedBy: 'Cusack, Mark J.',
      summary: 'An Act authorizing the grant of creditable service to Thomas Brooks',
      url: 'https://malegislature.gov/Bills/194/H5498'
    },
    {
      billNumber: 'H.5497',
      filedBy: 'Badger, Michelle L.',
      summary: 'An Act amending the town charter for the town of Plymouth',
      url: 'https://malegislature.gov/Bills/194/H5497'
    },
    {
      billNumber: 'H.5496',
      filedBy: '',
      summary:
        'An Act making appropriations for the fiscal year 2026 to provide for supplementing certain existing appropriations and for certain other activities a...',
      url: 'https://malegislature.gov/Bills/194/H5496'
    },
    {
      billNumber: 'H.5495',
      filedBy: 'Fiola, Carole A.',
      summary: 'Resolutions designating August 8th and 9th, 2026 as the sales tax holiday',
      url: 'https://malegislature.gov/Bills/194/H5495'
    },
    {
      billNumber: 'H.5494',
      filedBy: 'Walsh, Thomas P.',
      summary: 'Floor Amendment',
      url: 'https://malegislature.gov/Bills/194/H5494'
    },
    {
      billNumber: 'H.5493',
      filedBy: 'Ways and Means (H)',
      summary:
        'An Act making appropriations for the fiscal year 2026 to provide for supplementing certain existing appropriations and for certain other activities a...',
      url: 'https://malegislature.gov/Bills/194/H5493'
    },
    {
      billNumber: 'H.5492',
      filedBy: 'Ways and Means (H)',
      summary:
        'An Act authorizing the town of Billerica to transfer control of certain land in the town of Billerica for the Yankee Doodle Bike Path',
      url: 'https://malegislature.gov/Bills/194/H5492'
    },
    {
      billNumber: 'H.5491',
      filedBy: 'Ways and Means (H)',
      summary: 'An Act implementing the recommendations of the Walsh-Kennedy Commission Report',
      url: 'https://malegislature.gov/Bills/194/H5491'
    },
    {
      billNumber: 'H.5490',
      filedBy: 'Ways and Means (H)',
      summary:
        'An Act providing for the ownership and maintenance of the Town Line Brook and Linden Brook culverts and dams',
      url: 'https://malegislature.gov/Bills/194/H5490'
    },
    {
      billNumber: 'H.5489',
      filedBy: 'Ways and Means (H)',
      summary: 'An Act regarding free expression',
      url: 'https://malegislature.gov/Bills/194/H5489'
    },
    {
      billNumber: 'H.5488',
      filedBy: 'Ways and Means (H)',
      summary: 'An Act relative to violation of regulation regarding hot work processes',
      url: 'https://malegislature.gov/Bills/194/H5488'
    },
    {
      billNumber: 'H.5487',
      filedBy: 'Ciccolo, Michelle L.',
      summary:
        'An Act to establish a surcharge on specific residential development activities for the purpose of funding the creation of community housing',
      url: 'https://malegislature.gov/Bills/194/H5487'
    },
    {
      billNumber: 'H.5486',
      filedBy: 'Linsky, David Paul',
      summary: "An Act allowing 'print free' digital legal notices for the town of Wayland",
      url: 'https://malegislature.gov/Bills/194/H5486'
    },
    {
      billNumber: 'H.5485',
      filedBy: 'Linsky, David Paul',
      summary:
        'An Act authorizing the town of Wayland Select Board to grant permission to use land for green burials',
      url: 'https://malegislature.gov/Bills/194/H5485'
    },
    {
      billNumber: 'H.5484',
      filedBy: 'Luddy, Hadley',
      summary: 'An Act to prohibit the application of fertilizer in the town of Eastham',
      url: 'https://malegislature.gov/Bills/194/H5484'
    },
    {
      billNumber: 'H.5483',
      filedBy: 'Barrett, III, John',
      summary:
        'An Act allowing the town of Williamstown to ban second generation anticoagulant rodenticides (SGARs)',
      url: 'https://malegislature.gov/Bills/194/H5483'
    },
    {
      billNumber: 'H.5482',
      filedBy: 'Walsh, Thomas P.',
      summary:
        'An Act authorizing municipalities to opt-in to a temporary pilot to extend the hours of liquor licenses and to allow for public consumption in design...',
      url: 'https://malegislature.gov/Bills/194/H5482'
    },
    {
      billNumber: 'H.5481',
      filedBy: 'Linsky, David Paul',
      summary:
        'An Act authorizing the town of Wayland to grant additional licenses for the sale of all alcoholic beverages to be drunk on the premises',
      url: 'https://malegislature.gov/Bills/194/H5481'
    },
    {
      billNumber: 'H.5480',
      filedBy: 'Municipalities and Regional Government (J)',
      summary: 'Study Order',
      url: 'https://malegislature.gov/Bills/194/H5480'
    },
    {
      billNumber: 'H.5479',
      filedBy: '',
      summary: 'An Act establishing the Massachusetts consumer data privacy act',
      url: 'https://malegislature.gov/Bills/194/H5479'
    }
  ]);
});

test('throws exceptions on invalid bills', () => {
  expect(() =>
    validatePotentialBill({
      billNumber: '',
      filedBy: 'Labor and Workforce Development (J)',
      summary:
        'An Act to prevent wage theft, promote employer accountability, and enhance public enforcement',
      url: 'https://malegislature.gov/Bills/191/H5086'
    })
  ).toThrow(Error);
  expect(() =>
    validatePotentialBill({
      billNumber: '5086',
      filedBy: '',
      summary:
        'An Act to prevent wage theft, promote employer accountability, and enhance public enforcement',
      url: 'https://malegislature.gov/Bills/191/H5086'
    })
  ).toThrow(Error);
  expect(() =>
    validatePotentialBill({
      billNumber: 'H.5086',
      filedBy: 'Labor and Workforce Development (J)',
      summary: '',
      url: 'https://malegislature.gov/Bills/191/H5086'
    })
  ).toThrow(Error);
  expect(() =>
    validatePotentialBill({
      billNumber: 'H.5086',
      filedBy: 'Labor and Workforce Development (J)',
      summary:
        'An Act to prevent wage theft, promote employer accountability, and enhance public enforcement',
      url: ''
    })
  ).toThrow(Error);
  expect(() =>
    validatePotentialBill({
      billNumber: 'H5086',
      filedBy: 'Labor and Workforce Development (J)',
      summary:
        'An Act to prevent wage theft, promote employer accountability, and enhance public enforcement',
      url: 'https://malegislature.gov/Bills/191/H5086'
    })
  ).toThrow();
});

describe('queryRecentBills (#013: per-chamber scrape)', () => {
  const legislature = getCurrentLegislature();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetchReturning(html: string): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn(async () => new Response(html, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('refines the search by chamber via lawsbranchname', async () => {
    const fetchMock = stubFetchReturning(loadTextFixture('searchPage.html'));
    await queryRecentBillsForChamber(legislature, 'Senate');
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain(`Refinements%5Blawsbranchname%5D=${chamberSearchId('Senate')}`);
    expect(requestedUrl).toContain(`Refinements%5Blawsgeneralcourt%5D=${legislature.searchId}`);
  });

  it('scrapes both chambers and merges the results', async () => {
    const fetchMock = stubFetchReturning(loadTextFixture('searchPage.html'));
    const bills = await queryRecentBills(legislature);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const branches = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .map((url) =>
        (['House', 'Senate'] as Chamber[]).find((c) => url.includes(chamberSearchId(c)))
      );
    expect(new Set(branches)).toEqual(new Set(['House', 'Senate']));
    // The fixture has 25 bills; both chamber fetches return it, so the merged
    // list is the concatenation of the two scrapes.
    expect(bills).toHaveLength(50);
  });

  it('throws when a chamber search fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500, statusText: 'Server Error' }))
    );
    await expect(queryRecentBillsForChamber(legislature, 'House')).rejects.toThrow(
      'Search request failed'
    );
  });
});

test('Page that trigger bad extraction throws errors', () => {
  expect(() => {
    findBillsInSearchPage(`
    <table id="searchTable">
      <tbody>
        <tr>
          <td>
          ds
          </td>
          <td>
          <a href='/dog'></a>
          </td>
          <td>
          Bob
          </td>
          <td>
          I am kinda bill but where is my number
          </td>
        </tr>
      </tbody>
    </div>
    `);
  }).toThrow();
});
