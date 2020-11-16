import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  Column,
  CreateDateColumn
} from 'typeorm';
import Bill from './Bill';

@Entity()
export default class Tweet {
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
