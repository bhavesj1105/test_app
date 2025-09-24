# Bak Bak Server

A real-time messaging and calling backend built with Express.js, TypeScript, Socket.IO, and PostgreSQL.

## Features

- **Authentication**: Phone-based OTP authentication using Twilio
- **Real-time Messaging**: Socket.IO powered chat system
- **WebRTC Integration**: Voice and video calling support
- **Profile Management**: User profiles with image uploads
- **REST API**: Comprehensive REST endpoints for chats and messages
- **Database**: PostgreSQL with TypeORM for data persistence
- **File Uploads**: Profile picture and media file handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **SMS/Voice**: Twilio
- **File Upload**: Multer
- **Security**: bcrypt, CORS

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Twilio account (for SMS/OTP)

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd bakbak-server
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database**:
   ```sql
   CREATE DATABASE bakbak_db;
   CREATE USER bakbak_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE bakbak_db TO bakbak_user;
   ```

4. **Configure your .env file**:
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=bakbak_user
   DB_PASSWORD=your_password
   DB_DATABASE=bakbak_db
   JWT_SECRET=your_super_secret_jwt_key_here
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token

### Profile
- `GET /api/profile` - Get current user profile
- `POST /api/profile` - Update profile with image upload
- `PUT /api/profile` - Update profile fields

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:chatId` - Get specific chat details

### Messages
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/messages` - Send new message
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message

### Health Check
- `GET /` - Basic server info
- `GET /api/health` - Health check endpoint

## Socket.IO Events

### Connection Events
- `connection` - User connects
- `disconnect` - User disconnects

### Chat Events
- `join-room` - Join chat room
- `leave-room` - Leave chat room
- `send-message` - Send message to room
- `new-message` - Receive new message
- `typing` - User typing indicator
- `user-typing` - Typing notification
- `message-read` - Mark message as read

### Call Events
- `call-user` - Initiate call
- `incoming-call` - Receive call
- `answer-call` - Answer call
- `reject-call` - Reject call
- `end-call` - End call

### WebRTC Signaling
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Exchange ICE candidates

## Database Schema

### Users
- Profile information, phone authentication, online status

### Chats
- Direct and group chat management

### Messages
- Text, media, and system messages with read receipts

### Chat Participants
- User roles, permissions, and read status per chat

## Development Scripts

```bash
npm run dev              # Start development server with auto-reload
npm run dev:watch        # Development with file watching
npm run build            # Build TypeScript to JavaScript
npm run build:clean      # Clean build directory and rebuild
npm run typeorm          # TypeORM CLI commands
npm run migration:run    # Run database migrations
npm run schema:sync      # Synchronize database schema
```

## Project Structure

```
src/
├── config/           # Database and app configuration
├── entities/         # TypeORM database entities
├── middleware/       # Express middleware (auth, etc.)
├── routes/          # API route handlers
├── services/        # Business logic services
├── migrations/      # Database migrations
└── index.ts         # Application entry point
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 5000) |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_USERNAME` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_DATABASE` | Database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_VERIFY_SID` | Twilio Verify Service SID | Yes |

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build:clean
   ```

2. **Set production environment variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   # ... other production values
   ```

3. **Run migrations**:
   ```bash
   npm run migration:run
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
