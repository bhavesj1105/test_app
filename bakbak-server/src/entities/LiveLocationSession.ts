import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('live_location_sessions')
@Index(['chatId'])
export class LiveLocationSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // liveSessionId

  @Column({ name: 'chat_id' })
  chatId!: string;

  @Column({ name: 'owner_user_id' })
  ownerUserId!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
