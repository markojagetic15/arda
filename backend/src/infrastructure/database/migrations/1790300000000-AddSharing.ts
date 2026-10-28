import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSharing1790300000000 implements MigrationInterface {
  name = 'AddSharing1790300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "scope_type_enum" AS ENUM ('space', 'project', 'page')`,
    );
    await queryRunner.query(
      `CREATE TYPE "access_role_enum" AS ENUM ('view', 'comment', 'edit', 'full')`,
    );

    // scope_id points at spaces/projects/pages depending on scope_type, so it
    // has no foreign key; rows for deleted scopes are ignored when read.
    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id" uuid PRIMARY KEY,
        "scope_type" "scope_type_enum" NOT NULL,
        "scope_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "access_role_enum" NOT NULL,
        "invited_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_memberships_scope_user" UNIQUE ("scope_type", "scope_id", "user_id"),
        CONSTRAINT "FK_memberships_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_user_id" ON "memberships" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid PRIMARY KEY,
        "scope_type" "scope_type_enum" NOT NULL,
        "scope_id" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "role" "access_role_enum" NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "invited_by" uuid NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invitations_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_invitations_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_scope" ON "invitations" ("scope_type", "scope_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD "email_verified_at" timestamptz,
        ADD "email_verification_token_hash" varchar(64),
        ADD "email_verification_expires_at" timestamptz
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_verification_token_hash" ON "users" ("email_verification_token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_users_email_verification_token_hash"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "email_verification_expires_at",
        DROP COLUMN "email_verification_token_hash",
        DROP COLUMN "email_verified_at"
    `);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(`DROP TYPE "access_role_enum"`);
    await queryRunner.query(`DROP TYPE "scope_type_enum"`);
  }
}
