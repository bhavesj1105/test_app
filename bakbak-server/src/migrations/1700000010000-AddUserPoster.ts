import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserPoster1700000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({ name: 'poster_url', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'poster_svg', type: 'text', isNullable: true }),
      new TableColumn({ name: 'poster_theme', type: 'jsonb', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'poster_theme');
    await queryRunner.dropColumn('users', 'poster_svg');
    await queryRunner.dropColumn('users', 'poster_url');
  }
}
