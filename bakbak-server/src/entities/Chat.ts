import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './User';
import { Message } from './Message';
import { ChatParticipant } from './ChatParticipant';

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ChatType,
    default: ChatType.DIRECT,
  })
  type!: ChatType;

  @Column({ name: 'group_name', length: 100, nullable: true })
  groupName?: string;

  // For compatibility with requirement: 'isGroup' and 'title'
  @Column({ name: 'title', length: 100, nullable: true })
  title?: string;

  @Column({ name: 'is_group', default: false })
  isGroup!: boolean;

  @Column({ name: 'group_description', length: 500, nullable: true })
  groupDescription?: string;

  @Column({ name: 'group_avatar', nullable: true })
  groupAvatar?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Message, (message: any) => message.chat)
  messages!: Message[];

  @OneToMany(() => ChatParticipant, (participant: any) => participant.chat)
  chatParticipants!: ChatParticipant[];

  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable({
    name: 'chat_participants',
    joinColumn: {
      name: 'chat_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  participants!: User[];
}
