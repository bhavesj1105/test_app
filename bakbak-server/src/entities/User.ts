import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  Index,
} from 'typeorm';
import { Chat } from './Chat';
import { Message } from './Message';
import { ChatParticipant } from './ChatParticipant';

@Entity('users')
@Index(['countryCode', 'phone'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'country_code', length: 5 })
  countryCode!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ length: 100, nullable: true })
  name?: string;

  @Column({ length: 500, nullable: true })
  bio?: string;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  // Profile/Contact Poster fields
  @Column({ name: 'poster_url', nullable: true })
  posterUrl?: string | null;

  @Column({ name: 'poster_svg', type: 'text', nullable: true })
  posterSvg?: string | null;

  @Column({ name: 'poster_theme', type: 'jsonb', nullable: true })
  posterTheme?: { colors: string[]; blur?: number } | null;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_online', default: false })
  isOnline!: boolean;

  @Column({ name: 'last_seen', type: 'timestamp', nullable: true })
  lastSeen?: Date;

  @Column({ name: 'socket_id', nullable: true })
  socketId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Message, (message: any) => message.sender)
  sentMessages!: Message[];

  @OneToMany(() => ChatParticipant, (participant: any) => participant.user)
  chatParticipants!: ChatParticipant[];

  @ManyToMany(() => Chat, (chat: any) => chat.participants)
  chats!: Chat[];
}
