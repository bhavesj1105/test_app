import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class CreateMessageReactions1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'message_reactions',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'message_id', type: 'uuid', isNullable: false },
        { name: 'user_id', type: 'uuid', isNullable: false },
        { name: 'emoji', type: 'varchar', length: '32', isNullable: false },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
      foreignKeys: [
        { columnNames: ['message_id'], referencedTableName: 'messages', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
        { columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
      ],
    }));

    await queryRunner.createIndex('message_reactions', new TableIndex({ name: 'idx_message_reactions_message_id', columnNames: ['message_id'] }));
    await queryRunner.createIndex('message_reactions', new TableIndex({ name: 'idx_message_reactions_message_emoji', columnNames: ['message_id', 'emoji'] }));
    await queryRunner.createUniqueConstraint('message_reactions', new TableUnique({ name: 'uniq_message_user_emoji', columnNames: ['message_id', 'user_id', 'emoji'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('message_reactions', 'uniq_message_user_emoji');
    await queryRunner.dropIndex('message_reactions', 'idx_message_reactions_message_emoji');
    await queryRunner.dropIndex('message_reactions', 'idx_message_reactions_message_id');
    await queryRunner.dropTable('message_reactions');
  }
}
