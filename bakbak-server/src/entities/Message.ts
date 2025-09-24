import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Chat } from './Chat';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  SYSTEM = 'system',
  LOCATION = 'location',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
@Index(['chatId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chat_id' })
  chatId!: string;

  @Column({ name: 'sender_id' })
  senderId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type!: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  @Column({ name: 'reply_to', nullable: true })
  replyTo?: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize?: number;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  // Optional location metadata
  @Column({ name: 'location_lat', type: 'double precision', nullable: true })
  locationLat?: number;

  @Column({ name: 'location_lng', type: 'double precision', nullable: true })
  locationLng?: number;

  @Column({ name: 'location_title', type: 'varchar', length: 255, nullable: true })
  locationTitle?: string;

  // Optional message effects metadata (e.g., confetti, fireworks)
  @Column({ name: 'effects', type: 'jsonb', nullable: true })
  effects?: { type: string; params?: any };

  // Optional rich card payload from extensions
  @Column({ name: 'card_payload', type: 'jsonb', nullable: true })
  cardPayload?: { title: string; url: string; image?: string; action?: string; appId?: string; appName?: string };

  @Column({ name: 'is_edited', default: false })
  isEdited!: boolean;

  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt?: Date;

  // Soft delete (unsend)
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Chat, (chat) => chat.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => User, (user) => user.sentMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to' })
  repliedMessage?: Message;

  // Simple readBy array of userIds for now (could be normalized in separate table)
  @Column({ name: 'read_by', type: 'simple-array', nullable: true })
  readBy?: string[];
}

// SQL index suggestions:
// CREATE INDEX idx_messages_chat_created_at ON messages (chat_id, created_at DESC);
// CREATE INDEX idx_messages_chat_id ON messages (chat_id);
