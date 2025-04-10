# Blackdeep Tech

A robust Node.js backend application for project management with user authentication and authorization.

## 🚀 Features

- **Authentication System**: Secure login and registration with JWT
- **User Management**: Admin and user roles with different permissions
- **Project Management**: CRUD operations for projects
- **Collaboration**: Project collaboration functionality (details in separate documentation)
- **API Rate Limiting**: Protection against abuse
- **Error Handling**: Comprehensive error handling system
- **Logging**: Request logging middleware

## 🐳 Docker Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker Compose

#### Development Mode (with hot-reloading)

```bash
docker-compose -f docker-compose.dev.yml up
```

This will:

- Build a development container with hot-reloading enabled
- Start a MongoDB container
- Mount your local code to the container for live code changes
- Expose the app on port 3000

#### Production Mode

```bash
docker-compose up
```

This will:

- Build a production-ready container
- Start a MongoDB container
- Run the compiled version of the app
- Expose the app on port 3000

### Environment Variables

All required environment variables are defined in the Docker Compose files. For production deployments, you should modify these variables, particularly the `JWT_SECRET`.

### Docker Deployment Tips

1. **Custom MongoDB URI**

   ```bash
   docker-compose up -d mongodb
   docker-compose run -e MONGODB_URI=mongodb://custom-uri app
   ```

2. **Running tests in Docker**

   ```bash
   docker-compose run app npm test
   ```

3. **Building for production**
   ```bash
   docker build -t employees:latest .
   ```

## 📋 Technology Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Routing Controllers**: Decorator-based routing
- **JWT**: Authentication mechanism
- **Jest**: Testing framework
- **TypeDI**: Dependency injection

## 🏗️ Project Structure

```
src/
├── config/          # Application configuration
├── controllers/     # API route controllers
├── dtos/            # Data transfer objects
├── middlewares/     # Express middlewares
├── models/          # Mongoose models
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── seed/            # Database seeding
├── __tests__/       # Test files
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 🛣️ API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get JWT token

### Projects

- `GET /api/projects`: Get all projects (admin only)
- `GET /api/projects/:id`: Get specific project by ID (admin only)
- `POST /api/projects`: Create a new project (admin only)
- `PUT /api/projects/:id`: Update a project (admin only)
- `DELETE /api/projects/:id`: Delete a project (admin only)

### Collaboration

_Collaboration endpoints and logic details will be covered in separate documentation._

## 🧩 Models

### User

```typescript
{
  username: string;
  password: string; // Hashed
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}
```

### Project

```typescript
{
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Setup & Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/rachev3/Dimitar-Rachev-employees.git
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   PORT=3000                                    # Port number for the server
   NODE_ENV=development                         # Environment (development/production)

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/employee-collaboration    # MongoDB connection string

   # Authentication
   JWT_SECRET=your_very_long_and_secure_secret  # Secret key for JWT tokens
   JWT_EXPIRATION=2h                            # JWT token expiration time

   # Admin Account
   ADMIN_USERNAME=admin                         # Default admin username
   ADMIN_PASSWORD=admin123                      # Default admin password

   All variables are required for the application to function properly. Make sure to:

   - Use a strong, unique JWT_SECRET in production
   - Change default admin credentials in production
   - Update MONGODB_URI to point to your MongoDB instance

   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔒 Security Features

- Password hashing using bcrypt
- JWT authentication
- Role-based access control
- API rate limiting
- Request validation

## 📝 Development Practices

- TypeScript for type safety
- Dependency injection for better testability
- Decorator-based controllers
- Data validation using class-validator
- Clean code architecture
- Middleware-based error handling
