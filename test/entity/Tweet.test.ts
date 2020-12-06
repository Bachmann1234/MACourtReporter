import Bill from '../../src/entity/Bill';
import Tweet from '../../src/entity/Tweet';

test('Constructs a tweet from a bill', () => {
  const bill = new Bill();
  bill.filedBy = 'Bill';
  bill.summary = 'Wow! What a bill.';
  bill.billNumber = 'H.1201';
  bill.url = 'https://example.com';
  const tweet = new Tweet();
  tweet.bill = bill;
  tweet.body = 'Bill filed: H.1201 - Wow! What a bill. https://example.com';
  expect(Tweet.fromBill(bill)).toEqual(tweet);
});

test('Can handle a bill with no filer', () => {
  const bill = new Bill();
  bill.summary = 'Wow! What a bill.';
  bill.url = 'https://example.com';
  bill.billNumber = 'H.1201';
  const tweet = new Tweet();
  tweet.bill = bill;
  tweet.body = 'Somebody filed: H.1201 - Wow! What a bill. https://example.com';
  expect(Tweet.fromBill(bill)).toEqual(tweet);
});

test('Will shorten summary if its too long', () => {
  const bill = new Bill();
  bill.summary = `I am a tweet its a tweet and its amazing. Look at me while I type out the entire tweet. 
    Wow they really allow tweets to be long I wonder if I even need this tweet shortening 
    code it sure seems like I dont based on the data I have seen up to this point. 
    I dont know though, maybe I will?`;
  bill.filedBy = 'Bach';
  bill.billNumber = 'H.1201';
  bill.url = 'https://example.com';
  const tweet = new Tweet();
  tweet.bill = bill;
  tweet.body = `Bach filed: H.1201 - I am a tweet its a tweet and its amazing. Look at me while I type out the entire tweet. 
    Wow they really allow tweets to be long I wonder if I even need this tweet shortening 
    code it sure seems like I dont based on the data I h... https://example.com`;
  expect(Tweet.fromBill(bill)).toEqual(tweet);
});
