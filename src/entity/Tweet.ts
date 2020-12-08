import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  Column,
  CreateDateColumn
} from 'typeorm';
import Bill from './Bill';

const MAX_TWEET_LENGTH = 280;
const MA_POLI_HASH = '#mapoli';

@Entity()
export default class Tweet {
  static fromBill(bill: Bill): Tweet {
    const tweet = new Tweet();
    tweet.bill = bill;
    const spaceForTweet = MAX_TWEET_LENGTH - MA_POLI_HASH.length - ' '.length - bill.url.length;
    const proposedBody = `${bill.filedBy || 'Somebody'} filed: ${bill.billNumber} - ${
      bill.summary
    }`;
    if (proposedBody.length > spaceForTweet) {
      tweet.body = `${proposedBody.substring(0, spaceForTweet - 4)}... ${bill.url} ${MA_POLI_HASH}`;
    } else {
      tweet.body = `${proposedBody} ${bill.url} ${MA_POLI_HASH}`;
    }
    return tweet;
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created?: Date;

  @OneToOne(() => Bill)
  @JoinColumn()
  bill!: Bill;

  @Column('text')
  body!: string;
}
