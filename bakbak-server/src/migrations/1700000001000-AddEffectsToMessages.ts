import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEffectsToMessages1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasJsonb = true; // Postgres supports JSONB
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'effects',
        type: hasJsonb ? 'jsonb' : 'json',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('messages', 'effects');
  }
}
