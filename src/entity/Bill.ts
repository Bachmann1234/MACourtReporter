import { Entity, PrimaryGeneratedColumn, Column, Index, Unique, CreateDateColumn } from 'typeorm';
import { ScrapedBill } from '../clients/malegislature';

@Entity()
@Unique(['billNumber'])
export default class Bill {
  static fromScrapedBill(scrapedBill: ScrapedBill): Bill {
    const bill = new Bill();
    bill.billNumber = scrapedBill.billNumber;
    bill.filedBy = scrapedBill.filedBy;
    bill.url = scrapedBill.url;
    bill.summary = scrapedBill.summary;
    return bill;
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created?: Date;

  @Index('billNumber-idx')
  @Column()
  billNumber!: string;

  @Column('text')
  filedBy!: string;

  @Column('text')
  summary!: string;

  @Column('text')
  url!: string;
}
