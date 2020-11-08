import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export default class Bill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  billNumber!: string;

  @Column('text')
  filedBy!: string;

  @Column('text')
  url!: string;
}
