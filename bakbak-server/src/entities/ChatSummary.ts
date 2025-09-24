import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('chat_summaries')
@Index(['chatId', 'createdAt'])
export class ChatSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chat_id' })
  chatId!: string;

  @Column({ name: 'summary_text', type: 'text' })
  summaryText!: string;

  @Column({ name: 'model_version', type: 'varchar', length: 64, nullable: true })
  modelVersion?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
