import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('app_clients')
@Index(['clientId'], { unique: true })
export class AppClient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'client_id', type: 'varchar', length: 80, unique: true })
  clientId!: string;

  @Column({ name: 'client_secret_hash', type: 'varchar', length: 200 })
  clientSecretHash!: string;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @Column({ name: 'is_approved', type: 'boolean', default: false })
  isApproved!: boolean;

  @Column({ name: 'sandbox_origin', type: 'varchar', length: 255, nullable: true })
  sandboxOrigin?: string | null;

  @Column({ name: 'scopes', type: 'simple-array', nullable: true })
  scopes?: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
