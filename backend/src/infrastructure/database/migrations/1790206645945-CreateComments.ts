import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComments1790206645945 implements MigrationInterface {
  name = 'CreateComments1790206645945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "comments_anchor_type_enum" AS ENUM ('text', 'canvas-shape', 'kanban-card')
    `);
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid PRIMARY KEY,
        "page_id" uuid NOT NULL,
        "anchor_type" "comments_anchor_type_enum" NOT NULL,
        "anchor_id" character varying NOT NULL,
        "author_id" uuid NOT NULL,
        "author_name" character varying(200) NOT NULL,
        "body" text NOT NULL,
        "resolved" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comments_page_id" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_comments_page_anchor" ON "comments" ("page_id", "anchor_type", "anchor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TYPE "comments_anchor_type_enum"`);
  }
}
