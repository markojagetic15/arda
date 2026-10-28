import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHierarchyTables1790171024212 implements MigrationInterface {
  name = 'CreateHierarchyTables1790171024212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "pages_type_enum" AS ENUM ('document', 'canvas', 'kanban')`,
    );

    await queryRunner.query(`
      CREATE TABLE "spaces" (
        "id" uuid PRIMARY KEY,
        "name" varchar(160) NOT NULL,
        "owner_id" uuid NOT NULL,
        "parent_id" uuid,
        "position" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_spaces_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_spaces_parent_id" FOREIGN KEY ("parent_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_spaces_owner_parent_position" ON "spaces" ("owner_id", "parent_id", "position")`,
    );

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid PRIMARY KEY,
        "name" varchar(160) NOT NULL,
        "space_id" uuid NOT NULL,
        "parent_id" uuid,
        "position" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_projects_space_id" FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_projects_parent_id" FOREIGN KEY ("parent_id") REFERENCES "projects" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_space_parent_position" ON "projects" ("space_id", "parent_id", "position")`,
    );

    await queryRunner.query(`
      CREATE TABLE "pages" (
        "id" uuid PRIMARY KEY,
        "title" varchar(200) NOT NULL,
        "type" "pages_type_enum" NOT NULL DEFAULT 'document',
        "project_id" uuid NOT NULL,
        "parent_id" uuid,
        "position" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_pages_project_id" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pages_parent_id" FOREIGN KEY ("parent_id") REFERENCES "pages" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pages_project_parent_position" ON "pages" ("project_id", "parent_id", "position")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pages_parent_id" ON "pages" ("parent_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pages"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "spaces"`);
    await queryRunner.query(`DROP TYPE "pages_type_enum"`);
  }
}
