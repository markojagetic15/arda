import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentSnapshots1790172644809 implements MigrationInterface {
  name = 'CreateDocumentSnapshots1790172644809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "document_snapshots" (
        "page_id" uuid PRIMARY KEY,
        "state" bytea NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_document_snapshots_page_id" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "document_snapshots"`);
  }
}
