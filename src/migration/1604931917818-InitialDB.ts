import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDB1604931917818 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
