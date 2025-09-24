import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRecentlyDeleted1700000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'recently_deleted',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
        { name: 'item_type', type: 'varchar', length: '32', isNullable: false },
        { name: 'item_id', type: 'uuid', isNullable: false },
        { name: 'user_id', type: 'uuid', isNullable: false },
        { name: 'chat_id', type: 'uuid', isNullable: true },
        { name: 'deleted_at', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
        { name: 'expiry_at', type: 'timestamp with time zone', isNullable: false },
        { name: 'payload', type: 'jsonb', isNullable: true },
        { name: 'permanently_deleted', type: 'boolean', isNullable: false, default: false },
        { name: 'permanently_deleted_at', type: 'timestamp with time zone', isNullable: true },
        { name: 'restored_at', type: 'timestamp with time zone', isNullable: true },
        { name: 'created_at', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
      ],
    }));

    await queryRunner.createIndex('recently_deleted', new TableIndex({ name: 'idx_recently_deleted_user_type', columnNames: ['user_id', 'item_type'] }));
    await queryRunner.createIndex('recently_deleted', new TableIndex({ name: 'idx_recently_deleted_expiry', columnNames: ['expiry_at'] }));
    await queryRunner.createIndex('recently_deleted', new TableIndex({ name: 'idx_recently_deleted_item', columnNames: ['item_id'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('recently_deleted', 'idx_recently_deleted_item');
    await queryRunner.dropIndex('recently_deleted', 'idx_recently_deleted_expiry');
    await queryRunner.dropIndex('recently_deleted', 'idx_recently_deleted_user_type');
    await queryRunner.dropTable('recently_deleted');
  }
}
