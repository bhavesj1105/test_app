import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMessageSoftDelete1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('messages', new TableColumn({ name: 'is_deleted', type: 'boolean', isNullable: false, default: false }));
    await queryRunner.addColumn('messages', new TableColumn({ name: 'deleted_at', type: 'timestamp', isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('messages', 'deleted_at');
    await queryRunner.dropColumn('messages', 'is_deleted');
  }
}
