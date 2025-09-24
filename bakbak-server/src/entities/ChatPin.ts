import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Chat } from './Chat';
import { User } from './User';

@Entity('chat_pins')
@Unique('uniq_chat_pin_user_chat', ['userId', 'chatId'])
export class ChatPin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'chat_id', type: 'uuid' })
  chatId!: string;

  @CreateDateColumn({ name: 'pinned_at', type: 'timestamp with time zone' })
  pinnedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;
}
