# Procore Console - Enterprise RFI Hub

A modern, enterprise-grade Request for Information (RFI) management system built with React, Redux, Node.js, Express, and MySQL.

## 🎨 Features

### Enterprise-Grade UI

- **Premium Design System**: Clean, professional interface inspired by Apple, Walmart, and leading SaaS platforms
- **Inter Font Family**: Industry-standard typography for enterprise applications
- **Responsive Layout**: Optimized for desktop (1920px), laptop (1440px), tablet (1024px), and mobile (768px)
- **Modern Components**: Cards, pills, badges, and buttons with smooth transitions and hover effects

### Core Functionality

- **RFI Management**: Create, track, and manage RFIs with status workflow (open → answered → closed)
- **Priority System**: Urgent, high, medium, low priority levels with visual indicators
- **Ball-in-Court Tracking**: Monitor who's responsible for each RFI response
- **Real-time Metrics**: Dashboard with answer rates, cycle times, and urgent queue monitoring
- **Advanced Filtering**: Filter by status, priority, due date, and search terms
- **Project Context**: Multi-project support with project-based access control

### Security & Authentication

- **JWT Authentication**: Secure token-based authentication
- **Organization Isolation**: Multi-tenant architecture with organization-level data separation
- **Role-Based Access**: Project-level user permissions
- **Password Hashing**: bcrypt for secure password storage

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/khizaras/const.git
   cd const
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DB=procore

   # Server
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your_jwt_secret_min_16_chars
   ```

4. **Initialize the database**

   ```bash
   mysql -u root -p < server/db/schema.sql
   ```

5. **Start the development servers**

   Terminal 1 - Backend API:

   ```bash
   npm run server:dev
   ```

   Terminal 2 - Frontend App:

   ```bash
   npm run client:dev
   ```

6. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

### Default Test Account

```
Organization ID: 1
Email: eng@example.com
Password: Passw0rd!
```

## 📁 Project Structure

```
procore/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Redux slices (auth, rfis)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── store/         # Redux store configuration
│   │   └── styles/        # Global LESS styles
│   └── webpack.config.js  # Webpack configuration
├── server/                # Node.js backend
│   ├── db/               # Database schema
│   └── src/
│       ├── config/       # Environment configuration
│       ├── db/           # Database connection pool
│       ├── middleware/   # Express middleware
│       ├── modules/      # Feature modules (auth, rfis)
│       ├── routes/       # Route definitions
│       └── utils/        # Utility functions
└── docs/                 # Documentation
```

## 🛠️ Technology Stack

### Frontend

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Ant Design 5** - UI component library
- **Axios** - HTTP client
- **Day.js** - Date manipulation
- **LESS** - CSS preprocessing
- **Webpack 5** - Module bundler

### Backend

- **Node.js** - Runtime environment
- **Express 4** - Web framework
- **MySQL 2** - Database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Zod** - Schema validation
- **Pino** - Logging
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

## 📊 Database Schema

### Key Tables

- **organizations** - Multi-tenant organization data
- **users** - User accounts with organization association
- **projects** - Project definitions
- **rfis** - RFI records with status, priority, assignments
- **rfi_responses** - Responses to RFIs
- **project_users** - User-project access mappings

## 🎯 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### RFIs

- `GET /api/projects/:projectId/rfis` - List RFIs with filters
- `GET /api/projects/:projectId/rfis/:rfiId` - Get RFI details
- `POST /api/projects/:projectId/rfis` - Create new RFI
- `PATCH /api/projects/:projectId/rfis/:rfiId` - Update RFI
- `POST /api/projects/:projectId/rfis/:rfiId/responses` - Add response
- `POST /api/projects/:projectId/rfis/:rfiId/watchers` - Add watcher
- `DELETE /api/projects/:projectId/rfis/:rfiId/watchers/:userId` - Remove watcher

## 🎨 Design System

### Color Palette

- **Primary**: `#0066FF` - Brand blue
- **Success**: `#00C853` - Green indicators
- **Warning**: `#FFB800` - Yellow alerts
- **Danger**: `#FF3D00` - Red urgent items
- **Neutral Scale**: 50-900 grayscale for backgrounds and text

### Spacing System

- `4px` (xs), `8px` (sm), `16px` (md), `24px` (lg), `32px` (xl), `48px` (2xl), `64px` (3xl)

### Typography

- **Font**: Inter (system fallback: -apple-system, Segoe UI)
- **Headings**: 48px, 36px, 32px, 24px, 18px, 16px
- **Body**: 14px base, 13px small, 12px captions

## 🔧 Development

### Available Scripts

```bash
npm run server:dev     # Start backend with nodemon
npm run client:dev     # Start frontend with webpack-dev-server
npm run client:build   # Build production bundle
npm run lint          # Run linter (placeholder)
```

### Code Style

- ESNext JavaScript/JSX
- Functional React components with hooks
- Redux Toolkit for state management
- Async/await for asynchronous operations
- Modular architecture with feature-based organization

## 📝 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 🐛 Known Issues

- Ant Design Card `bordered` prop deprecation warning (use `variant` instead)
- React Router future flags warnings (upgrade planned for v7)

## 🚀 Future Enhancements

- [ ] File attachments for RFIs
- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Document version control
- [ ] Integration with project management tools
- [ ] Email notifications
- [ ] Audit trail and activity logs
- [ ] Export to PDF/Excel
- [ ] Custom fields and workflows

---

Built with ❤️ using modern web technologies
