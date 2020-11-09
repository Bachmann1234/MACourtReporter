import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from 'typeorm';

@Entity()
@Unique(['billNumber'])
export default class Bill {
  @PrimaryGeneratedColumn()
  id!: number;

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
