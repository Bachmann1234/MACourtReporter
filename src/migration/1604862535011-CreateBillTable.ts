import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillTable1604862535011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
    CREATE TABLE "bill" (
        id SERIAL PRIMARY KEY,
        billNumber text NOT NULL,
        filedBy text NOT NULL,
        url text NOT NULL
    )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`DROP TABLE "bill"`);
  }
}
