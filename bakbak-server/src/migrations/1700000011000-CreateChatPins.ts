import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique, TableIndex } from 'typeorm';

export class CreateChatPins1700000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'chat_pins',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
        { name: 'user_id', type: 'uuid', isNullable: false },
        { name: 'chat_id', type: 'uuid', isNullable: false },
        { name: 'pinned_at', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
      ],
    }));

    await queryRunner.createForeignKey('chat_pins', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('chat_pins', new TableForeignKey({
      columnNames: ['chat_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'chats',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createUniqueConstraint('chat_pins', new TableUnique({
      name: 'uniq_chat_pin_user_chat',
      columnNames: ['user_id', 'chat_id'],
    }));

    await queryRunner.createIndex('chat_pins', new TableIndex({ name: 'idx_chat_pins_user', columnNames: ['user_id'] }));
    await queryRunner.createIndex('chat_pins', new TableIndex({ name: 'idx_chat_pins_chat', columnNames: ['chat_id'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('chat_pins', 'idx_chat_pins_chat');
    await queryRunner.dropIndex('chat_pins', 'idx_chat_pins_user');
    await queryRunner.dropUniqueConstraint('chat_pins', 'uniq_chat_pin_user_chat');
    // Drop FKs implicitly with table
    await queryRunner.dropTable('chat_pins');
  }
}
