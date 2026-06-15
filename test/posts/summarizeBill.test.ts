import type Anthropic from '@anthropic-ai/sdk';
import { maybeBuildReply, summarizeBill } from '../../src/posts/summarizeBill';

const BILL = {
  billNumber: 'H.5504',
  summary: 'An Act authorizing the town of Hingham to grant certain parcels of land',
  url: 'https://malegislature.gov/Bills/194/H5504'
};

// A stand-in Anthropic client whose messages.create resolves to a content array.
// Summaries come back as a single text block holding the decision JSON.
function fakeClient(content: unknown): Anthropic {
  return {
    messages: { create: vi.fn(async () => ({ content })) }
  } as unknown as Anthropic;
}

function textBlock(json: unknown): unknown[] {
  return [{ type: 'text', text: typeof json === 'string' ? json : JSON.stringify(json) }];
}

describe('summarizeBill', () => {
  it('returns the summary text when the model decides a reply adds value', async () => {
    const client = fakeClient(textBlock({ reply: true, summary: '  This would do a thing.  ' }));
    const decision = await summarizeBill(BILL, 'SECTION 1. ...', client);
    expect(decision).toEqual({ reply: true, text: 'This would do a thing.' });
  });

  it('returns no reply when the model decides to skip', async () => {
    const client = fakeClient(textBlock({ reply: false, summary: '' }));
    expect(await summarizeBill(BILL, 'SECTION 1. ...', client)).toEqual({ reply: false });
  });

  it('drops a reply whose summary overruns the 300-char budget', async () => {
    const client = fakeClient(textBlock({ reply: true, summary: 'x'.repeat(301) }));
    expect(await summarizeBill(BILL, 'SECTION 1. ...', client)).toEqual({ reply: false });
  });

  it('drops a reply with an empty summary', async () => {
    const client = fakeClient(textBlock({ reply: true, summary: '   ' }));
    expect(await summarizeBill(BILL, 'SECTION 1. ...', client)).toEqual({ reply: false });
  });

  it('returns no reply on malformed model output', async () => {
    const client = fakeClient(textBlock('not json{'));
    expect(await summarizeBill(BILL, 'SECTION 1. ...', client)).toEqual({ reply: false });
  });

  it('returns no reply when the response has no text block', async () => {
    const client = fakeClient([{ type: 'thinking', thinking: '...' }]);
    expect(await summarizeBill(BILL, 'SECTION 1. ...', client)).toEqual({ reply: false });
  });
});

describe('maybeBuildReply (best-effort)', () => {
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = '';
  });

  it('is off (no reply) when ANTHROPIC_API_KEY is unset, without fetching or calling', async () => {
    process.env.ANTHROPIC_API_KEY = '';
    const fetchText = vi.fn();
    const decision = await maybeBuildReply(BILL, { fetchText });
    expect(decision).toEqual({ reply: false });
    expect(fetchText).not.toHaveBeenCalled();
  });

  it('fetches the bill text and returns the model decision when configured', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    const fetchText = vi.fn(async () => 'SECTION 1. real bill text');
    const client = fakeClient(textBlock({ reply: true, summary: 'Plain-English summary.' }));
    const decision = await maybeBuildReply(BILL, { fetchText, client });
    expect(fetchText).toHaveBeenCalledWith(BILL.billNumber, BILL.url);
    expect(decision).toEqual({ reply: true, text: 'Plain-English summary.' });
  });

  it('degrades to no reply when the text fetch fails', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    const fetchText = vi.fn(async () => {
      throw new Error('network down');
    });
    const client = fakeClient(textBlock({ reply: true, summary: 'should never be used' }));
    expect(await maybeBuildReply(BILL, { fetchText, client })).toEqual({ reply: false });
  });

  it('degrades to no reply when the bill text is empty', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    const fetchText = vi.fn(async () => '');
    const create = vi.fn();
    const client = { messages: { create } } as unknown as Anthropic;
    expect(await maybeBuildReply(BILL, { fetchText, client })).toEqual({ reply: false });
    expect(create).not.toHaveBeenCalled();
  });

  it('degrades to no reply when the model call throws', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    const fetchText = vi.fn(async () => 'SECTION 1. real bill text');
    const client = {
      messages: {
        create: vi.fn(async () => {
          throw new Error('API error');
        })
      }
    } as unknown as Anthropic;
    expect(await maybeBuildReply(BILL, { fetchText, client })).toEqual({ reply: false });
  });
});
