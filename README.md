# VelSoft ERP - Modern Enterprise Resource Planning System

A modern, AI-enhanced ERP system built with React, Node.js, and PostgreSQL.

## Features

- 🏢 Complete Business Management
  - Inventory Management
  - Billing & Invoicing (GST-ready)
  - Finance/Accounting
  - Purchase & Sales
  - Production Planning
  - HR & Payroll
  - CRM

- 🤖 AI-Powered Features
  - GPT-4 powered business assistant
  - Natural language queries for reports
  - Predictive inventory management
  - Smart data entry assistance

- 📊 Smart Dashboard
  - Real-time business insights
  - Customizable widgets
  - Advanced analytics
  - Performance metrics

- 📱 Modern UI/UX
  - Responsive design
  - Dark/Light mode
  - Intuitive navigation
  - Mobile-first approach

## Tech Stack

### Frontend
- React 18
- TailwindCSS
- React Query
- React Router
- Chart.js
- React Hook Form

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- OpenAI GPT-4 API

### DevOps & Tools
- TypeScript
- ESLint
- Prettier
- Jest
- React Testing Library

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/velsoft-erp.git
cd velsoft-erp
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables
```bash
# Backend .env
cp .env.example .env
# Add your database URL and OpenAI API key

# Frontend .env
cp .env.example .env
# Add your backend API URL
```

4. Initialize the database
```bash
cd backend
npx prisma migrate dev
```

5. Start the development servers
```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## Project Structure

```
velsoft-erp/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
├── backend/                # Node.js backend application
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Prisma models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── prisma/            # Database schema and migrations
│
└── docs/                  # Documentation
```

## License

MIT

## Support

For support, email support@velsoft.com or open an issue in the repository. 