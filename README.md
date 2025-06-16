# ArticleRadar - Content Analytics Dashboard

A comprehensive content aggregation and analytics dashboard that provides real-time insights across multiple media channels.

## Features

- **Multi-Platform Aggregation**: Track content from Instagram, Facebook, X (Twitter), and websites
- **Real-Time Analytics**: Live data visualization with professional charts and metrics
- **Content Modal**: Detailed article/post viewing with engagement metrics
- **Theme Support**: Light and dark mode with professional blue color scheme
- **User Authentication**: Secure login with Replit Auth integration
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **State Management**: TanStack Query for server state
- **Build Tool**: Vite

## Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Environment variables (see below)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Database
   DATABASE_URL=postgresql://neondb_owner:npg_rTKRL8xeJ5Dy@ep-silent-star-a85i6ag5-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
   
   # Session
   SESSION_SECRET=fd2ba72cf084bfa56c9354cddebaaa0530a3b60335e0694bbe29f42e98b9844fe99f5b4046e805e5af403c77e50cadafb6c3c5f7c13abb94301d0b6356c80fa1
   
   # Replit Auth (for production)
   REPL_ID=your-repl-id
   ISSUER_URL=https://replit.com/oidc
   REPLIT_DOMAINS=your-domain.replit.app
   ```

4. Run database migrations:
   ```bash
   npx drizzle-kit push:pg
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   └── contexts/       # React contexts
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data access layer
│   └── replitAuth.ts      # Authentication middleware
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts          # Database schema and types
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Login with Replit Auth
- `GET /api/logout` - Logout and clear session

### Resources
- `POST /api/resources` - Create new content resource
- `GET /api/resources` - Get user's resources
- `GET /api/resources/:id/analytics` - Get analytics data
- `GET /api/resources/:id/metrics` - Get aggregated metrics
- `GET /api/resources/:id/recent-content` - Get recent content

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `REPL_ID` | Replit application ID | Production only |
| `ISSUER_URL` | OpenID Connect issuer URL | Production only |
| `REPLIT_DOMAINS` | Comma-separated list of allowed domains | Production only |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature description'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.