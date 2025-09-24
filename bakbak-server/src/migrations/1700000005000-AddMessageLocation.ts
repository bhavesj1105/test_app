import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMessageLocation1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('messages', [
      new TableColumn({ name: 'location_lat', type: 'double precision', isNullable: true }),
      new TableColumn({ name: 'location_lng', type: 'double precision', isNullable: true }),
      new TableColumn({ name: 'location_title', type: 'varchar', length: '255', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('messages', 'location_title');
    await queryRunner.dropColumn('messages', 'location_lng');
    await queryRunner.dropColumn('messages', 'location_lat');
  }
}
