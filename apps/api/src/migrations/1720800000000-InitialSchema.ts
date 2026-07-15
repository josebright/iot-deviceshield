import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1720800000000 implements MigrationInterface {
  name = 'InitialSchema1720800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'email', type: 'varchar', length: '254', isNullable: false },
          { name: 'passwordHash', type: 'varchar', length: '255', isNullable: false },
          { name: 'role', type: 'users_role_enum', default: `'user'`, isNullable: false },
          { name: 'createdAt', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_users_email_unique', columnNames: ['email'], isUnique: true }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'smart_home_categories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'smart_home_devices',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'categoryId', type: 'int', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'smart_home_devices',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'smart_home_categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'smart_home_vulnerabilities',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'cveId', type: 'varchar', isNullable: true },
          { name: 'vulnerability', type: 'text', isNullable: true },
          { name: 'impact', type: 'text', isNullable: true },
          { name: 'affectedSystem', type: 'text', isNullable: true },
          { name: 'lastModified', type: 'text', isNullable: true },
          { name: 'vulnStatus', type: 'text', isNullable: true },
          { name: 'metrics', type: 'json', isNullable: true },
          { name: 'threats', type: 'text', isNullable: true },
          { name: 'recommendations', type: 'text', isNullable: true },
          { name: 'references', type: 'text', isNullable: true },
          { name: 'deviceId', type: 'int', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'smart_home_vulnerabilities',
      new TableIndex({
        name: 'IDX_vulns_cveId_unique',
        columnNames: ['cveId'],
        isUnique: true,
      }),
    );
    await queryRunner.createForeignKey(
      'smart_home_vulnerabilities',
      new TableForeignKey({
        columnNames: ['deviceId'],
        referencedTableName: 'smart_home_devices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('smart_home_vulnerabilities', true);
    await queryRunner.dropTable('smart_home_devices', true);
    await queryRunner.dropTable('smart_home_categories', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}
