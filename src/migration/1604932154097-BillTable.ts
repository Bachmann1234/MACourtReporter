import { MigrationInterface, QueryRunner } from 'typeorm';

export class BillTable1604932154097 implements MigrationInterface {
  name = 'BillTable1604932154097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "bill" (
                "id" SERIAL NOT NULL,
                "billNumber" character varying NOT NULL,
                "filedBy" text NOT NULL,
                "summary" text NOT NULL,
                "url" text NOT NULL,
                CONSTRAINT "UQ_27b6bbeec43f500a2cc7628a7d3" UNIQUE ("billNumber"),
                CONSTRAINT "PK_683b47912b8b30fe71d1fa22199" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "billNumber-idx" ON "bill" ("billNumber")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "billNumber-idx"
        `);
    await queryRunner.query(`
            DROP TABLE "bill"
        `);
  }
}
