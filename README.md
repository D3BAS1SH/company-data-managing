# Company Data Management API

A robust Express.js REST API built with TypeScript, MongoDB, and comprehensive documentation. This starter template provides a solid foundation for building scalable company data management systems.

## 🚀 Features

- **TypeScript**: Full type safety and better development experience
- **Express.js**: Fast, unopinionated web framework
- **MongoDB & Mongoose**: NoSQL database with elegant object modeling
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Logging**: HTTP request logging with Morgan
- **Development Tools**: Hot reload, linting, formatting, and debugging support
- **Production Ready**: Optimized for deployment with Docker support

## 📁 Project Structure

```
company-data-managing/
├── src/
│   ├── configs/
│   │   └── db.ts                 # MongoDB connection configuration
│   ├── controllers/              # Route controllers
│   ├── middleware/
│   │   └── errorHandler.ts       # Global error handling middleware
│   ├── models/
│   │   └── some.model.ts         # Mongoose model documentation & examples
│   ├── routes/                   # API routes
│   ├── types/                    # TypeScript type definitions
│   ├── utils/
│   │   ├── apiResponse.ts        # API response utilities (ApiResponse, ApiError)
│   │   ├── asyncHandler.ts       # Async error handling wrapper
│   │   └── swagger.ts            # Swagger/OpenAPI configuration
│   ├── app.ts                    # Express app configuration
│   └── server.ts                 # Server entry point
├── dist/                         # Compiled JavaScript (auto-generated)
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── nodemon.json                 # Nodemon configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd company-data-managing
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:5
   ```

5. **Run the application**

   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
API_PREFIX=/api/v1

# Database
MONGODB_URI=mongodb://localhost:27017/company-data-managing

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
```

## 📚 API Documentation

Once the server is running, you can access:

- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **API Root**: http://localhost:3000/api/v1

## 🏗️ Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Adding New Features

1. **Models**: Create Mongoose models in `src/models/`
2. **Routes**: Add API routes in `src/routes/`
3. **Controllers**: Add business logic in `src/controllers/`
4. **Middleware**: Add custom middleware in `src/middleware/`
5. **Types**: Add TypeScript types in `src/types/`

### Creating Models

Follow the comprehensive documentation in `src/models/some.model.ts` for:

- Interface definitions
- Schema setup with validation
- Indexes for performance
- Virtual properties
- Middleware (hooks)
- Instance and static methods
- Swagger documentation

### Error Handling

The application uses a centralized error handling approach:

```typescript
import { ApiError } from './utils/apiResponse';

// Throw custom errors
throw ApiError.badRequest('Invalid input data');
throw ApiError.notFound('User not found');
throw ApiError.unauthorized('Invalid credentials');

// Use async handler for automatic error catching
import asyncHandler from './utils/asyncHandler';

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  res.json(new ApiResponse(200, 'User found', user));
});
```

## 🐳 Docker Support

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/company-data
    depends_on:
      - mongo

  mongo:
    image: mongo:5
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Running with Docker

```bash
# Build and run
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse and DDoS
- **Input Validation**: Request validation and sanitization
- **Environment Variables**: Sensitive data protection
- **JWT Authentication**: Stateless authentication
- **Password Hashing**: Bcrypt with salt rounds

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```http
GET /health
```

Response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Service is healthy",
  "data": {
    "uptime": 3600,
    "message": "OK",
    "timestamp": "2023-08-24T10:30:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "memory": {
      "rss": 45678592,
      "heapTotal": 20971520,
      "heapUsed": 18874368
    }
  }
}
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set strong JWT secret
- [ ] Configure CORS allowed origins
- [ ] Set up reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Optimize database indexes

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name "company-api"

# Monitor
pm2 monit

# Logs
pm2 logs company-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - _Initial work_ - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB team for the robust database
- TypeScript team for type safety
- All contributors to the open source packages used

---

**Happy Coding! 🎉**
