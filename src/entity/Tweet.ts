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

@Entity()
export default class Tweet {
  static fromBill(bill: Bill): Tweet {
    const tweet = new Tweet();
    tweet.bill = bill;
    const spaceForTweet = MAX_TWEET_LENGTH - bill.url.length;
    const proposedBody = `${bill.filedBy || 'Somebody'} filed: ${bill.summary}`;
    if (proposedBody.length > spaceForTweet) {
      tweet.body = `${proposedBody.substring(0, spaceForTweet - 4)}... ${bill.url}`;
    } else {
      tweet.body = `${proposedBody} ${bill.url}`;
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
