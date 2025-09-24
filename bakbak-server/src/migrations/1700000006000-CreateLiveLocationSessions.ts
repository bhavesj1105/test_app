import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLiveLocationSessions1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'live_location_sessions',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'chat_id', type: 'uuid', isNullable: false },
        { name: 'owner_user_id', type: 'uuid', isNullable: false },
        { name: 'expires_at', type: 'timestamp', isNullable: false },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
      foreignKeys: [
        { columnNames: ['chat_id'], referencedTableName: 'chats', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
        { columnNames: ['owner_user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
      ],
    }));
    await queryRunner.createIndex('live_location_sessions', new TableIndex({ name: 'idx_live_location_chat', columnNames: ['chat_id'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('live_location_sessions', 'idx_live_location_chat');
    await queryRunner.dropTable('live_location_sessions');
  }
}
