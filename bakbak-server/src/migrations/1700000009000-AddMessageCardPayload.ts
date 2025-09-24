import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMessageCardPayload1700000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('messages', new TableColumn({ name: 'card_payload', type: 'jsonb', isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('messages', 'card_payload');
  }
}
