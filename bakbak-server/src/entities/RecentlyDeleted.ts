import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type RecentlyDeletedItemType = 'message' | 'chat';

@Entity('recently_deleted')
@Index(['userId', 'itemType'])
@Index(['expiryAt'])
export class RecentlyDeleted {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_type', type: 'varchar', length: 32 })
  itemType!: RecentlyDeletedItemType; // 'message' | 'chat'

  @Column({ name: 'item_id', type: 'uuid' })
  itemId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string; // owner who initiated delete

  @Column({ name: 'chat_id', type: 'uuid', nullable: true })
  chatId?: string | null; // for message rows

  @Column({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt!: Date;

  @Column({ name: 'expiry_at', type: 'timestamp with time zone' })
  expiryAt!: Date; // after which we auto purge

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload?: any; // snapshot of the item required for restore

  @Column({ name: 'permanently_deleted', type: 'boolean', default: false })
  permanentlyDeleted!: boolean;

  @Column({ name: 'permanently_deleted_at', type: 'timestamp with time zone', nullable: true })
  permanentlyDeletedAt?: Date | null;

  @Column({ name: 'restored_at', type: 'timestamp with time zone', nullable: true })
  restoredAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
