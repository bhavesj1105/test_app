import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateChatSummaries1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'chat_summaries',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'chat_id', type: 'uuid', isNullable: false },
        { name: 'summary_text', type: 'text', isNullable: false },
        { name: 'model_version', type: 'varchar', length: '64', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
      foreignKeys: [
        { columnNames: ['chat_id'], referencedTableName: 'chats', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
      ],
    }));
    await queryRunner.createIndex('chat_summaries', new TableIndex({ name: 'idx_chat_summaries_chat_created', columnNames: ['chat_id', 'created_at'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('chat_summaries', 'idx_chat_summaries_chat_created');
    await queryRunner.dropTable('chat_summaries');
  }
}
