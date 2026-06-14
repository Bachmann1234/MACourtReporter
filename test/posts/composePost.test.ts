import { type ComposableBill, composePostText } from '../../src/posts/composePost';

test('Constructs post text from a bill', () => {
  const bill: ComposableBill = {
    filedBy: 'Bill',
    summary: 'Wow! What a bill.',
    billNumber: 'H.1201',
    url: 'https://example.com'
  };
  expect(composePostText(bill)).toEqual(
    'Bill filed: H.1201 - Wow! What a bill. https://example.com #mapoli'
  );
});

test('Can handle a bill with no filer', () => {
  const bill: ComposableBill = {
    filedBy: '',
    summary: 'Wow! What a bill.',
    billNumber: 'H.1201',
    url: 'https://example.com'
  };
  expect(composePostText(bill)).toEqual(
    'Somebody filed: H.1201 - Wow! What a bill. https://example.com #mapoli'
  );
});

test('Will shorten summary if its too long', () => {
  const bill: ComposableBill = {
    summary: `I am a tweet its a tweet and its amazing. Look at me while I type out the entire tweet.
    Wow they really allow tweets to be long I wonder if I even need this tweet shortening
    code it sure seems like I dont based on the data I have seen up to this point.
    I dont know though, maybe I will?`,
    filedBy: 'Bach',
    billNumber: 'H.1201',
    url: 'https://example.com'
  };
  expect(composePostText(bill)).toEqual(
    `Bach filed: H.1201 - I am a tweet its a tweet and its amazing. Look at me while I type out the entire tweet.
    Wow they really allow tweets to be long I wonder if I even need this tweet shortening
    code it sure seems like I dont based on the da... https://example.com #mapoli`
  );
});
