import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTweetTable1605485483553 implements MigrationInterface {
  name = 'CreateTweetTable1605485483553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tweet" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "body" text NOT NULL, "billId" integer, CONSTRAINT "REL_1a73a6fe25c8d691a68b8529ee" UNIQUE ("billId"), CONSTRAINT "PK_6dbf0db81305f2c096871a585f6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "bill" ADD "created" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(
      `ALTER TABLE "tweet" ADD CONSTRAINT "FK_1a73a6fe25c8d691a68b8529ee5" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tweet" DROP CONSTRAINT "FK_1a73a6fe25c8d691a68b8529ee5"`);
    await queryRunner.query(`ALTER TABLE "bill" DROP COLUMN "created"`);
    await queryRunner.query(`DROP TABLE "tweet"`);
  }
}
