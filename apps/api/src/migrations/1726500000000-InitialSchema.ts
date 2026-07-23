import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1726500000000 implements MigrationInterface {
  name = 'InitialSchema1726500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "smart_home_categories" (
        "id" SERIAL PRIMARY KEY,
        "slug" text NOT NULL,
        "name" text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_categories_slug" ON "smart_home_categories" ("slug")`,
    );

    await queryRunner.query(`
      CREATE TABLE "smart_home_devices" (
        "id" SERIAL PRIMARY KEY,
        "slug" text NOT NULL,
        "name" text NOT NULL,
        "vendor" text,
        "product" text,
        "cpe_name" text,
        "cpe_confidence" real,
        "cpe_resolved_at" timestamptz,
        "category_id" int NOT NULL REFERENCES "smart_home_categories"("id") ON DELETE CASCADE,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_devices_slug" ON "smart_home_devices" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_devices_category" ON "smart_home_devices" ("category_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "smart_home_vulnerabilities_cache" (
        "device_id" int PRIMARY KEY REFERENCES "smart_home_devices"("id") ON DELETE CASCADE,
        "payload" jsonb NOT NULL,
        "match_source" text NOT NULL,
        "match_query" text NOT NULL,
        "cpe_confidence" real,
        "fetched_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_vuln_cache_fetched_at" ON "smart_home_vulnerabilities_cache" ("fetched_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_metadata" (
        "id" int PRIMARY KEY DEFAULT 1,
        "last_refresh_at" timestamptz,
        "source_version" text,
        "error_count" int NOT NULL DEFAULT 0,
        "last_error" text,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "catalog_metadata_singleton" CHECK ("id" = 1)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "smart_home_clients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "fingerprint_hash" text NOT NULL,
        "client_id_header" text,
        "ip_last" inet,
        "user_agent_last" text,
        "accept_language" text,
        "request_count" bigint NOT NULL DEFAULT 0,
        "status" text NOT NULL DEFAULT 'active',
        "status_reason" text,
        "status_changed_at" timestamptz,
        "strike_count" int NOT NULL DEFAULT 0,
        "throttle_until" timestamptz,
        "first_seen_at" timestamptz NOT NULL DEFAULT now(),
        "last_seen_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_clients_fingerprint" ON "smart_home_clients" ("fingerprint_hash")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_clients_status" ON "smart_home_clients" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_clients_last_seen" ON "smart_home_clients" ("last_seen_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "smart_home_clients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "catalog_metadata"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "smart_home_vulnerabilities_cache"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "smart_home_devices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "smart_home_categories"`);
  }
}
