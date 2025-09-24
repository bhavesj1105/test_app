import { DataSource } from 'typeorm';
import { User, Chat, Message, ChatParticipant, MessageReaction, ChatSummary, LiveLocationSession, RecentlyDeleted, AppClient, ChatPin } from '../entities';

const useUrl = process.env.DATABASE_URL;
export const AppDataSource = new DataSource(
  useUrl
    ? {
        type: 'postgres',
        url: useUrl,
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
  entities: [User, Chat, Message, ChatParticipant, MessageReaction, ChatSummary, LiveLocationSession, RecentlyDeleted, AppClient, ChatPin],
        migrations: ['src/migrations/**/*.ts'],
        subscribers: ['src/subscribers/**/*.ts'],
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'bakbak_db',
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
  entities: [User, Chat, Message, ChatParticipant, MessageReaction, ChatSummary, LiveLocationSession, RecentlyDeleted, AppClient, ChatPin],
        migrations: ['src/migrations/**/*.ts'],
        subscribers: ['src/subscribers/**/*.ts'],
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
);

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Running in development mode - database schema will be synchronized');
    }
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  }
};
