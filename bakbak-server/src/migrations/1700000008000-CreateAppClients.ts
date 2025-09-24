import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppClients1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'app_clients',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
        { name: 'name', type: 'varchar', length: '120', isNullable: false },
        { name: 'client_id', type: 'varchar', length: '80', isNullable: false, isUnique: true },
        { name: 'client_secret_hash', type: 'varchar', length: '200', isNullable: false },
        { name: 'created_by_user_id', type: 'uuid', isNullable: true },
        { name: 'is_approved', type: 'boolean', isNullable: false, default: false },
        { name: 'sandbox_origin', type: 'varchar', length: '255', isNullable: true },
        { name: 'scopes', type: 'varchar', length: '1000', isNullable: true },
        { name: 'created_at', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', isNullable: false, default: 'now()' },
      ],
    }));
    await queryRunner.createIndex('app_clients', new TableIndex({ name: 'idx_app_clients_client_id', columnNames: ['client_id'], isUnique: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('app_clients', 'idx_app_clients_client_id');
    await queryRunner.dropTable('app_clients');
  }
}
