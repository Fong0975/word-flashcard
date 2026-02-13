# Word Flashcard

A language learning flashcard system built with Go, designed for quick word and question management.
The application features a REST API backend and an HTML frontend interface.

## Project Structure

```
word-flashcard/
├── data/                          # Database peers and models
│   ├── mocks/                    # Mock function for testing
│   ├── models/                   # Data models
│   ├── peers/                    # Database peers (query builders)
│   ├── schema/                   # Database schema definitions
│   └── registry.go               # Data model registry
├── dist/                          # Build output directory
├── docs/                          # Auto-generated Swagger API documentation
├── internal/                      # Internal application code
│   ├── controllers/              # API controllers
│   ├── handlers/                 # HTTP Web handlers
│   ├── middleware/               # HTTP middleware
│   ├── mocks/                    # Mock interfaces for testing
│   ├── models/                   # Data models
│   └── routers/                  # Route configuration
├── utils/                         # Utility modules
│   ├── cambridge-dictionary-api/ # Cambridge Dictionary API sub-service
│   ├── config/                   # Configuration module
│   ├── database/                 # Database module with MySQL/PostgreSQL support
│   ├── log/                      # Logging module
│   ├── conversion_utils.go       # Type conversion utilities
│   ├── dictionary-testing.json   # Mockoon file for Cambridge Dictionary API sub-service
│   └── pointer_utils.go          # Pointer utility functions
├── web/                           # React frontend application
│   ├── public/                   # Public assets
│   ├── src/                      # React source code
│   ├── .env.example              # Environment variables template
│   ├── Dockerfile                # Dockerfile for frontend service
│   ├── README.md                 # React app documentation
│   ├── package.json              # React dependencies
│   ├── package-lock.json         # React dependency lock file
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   └── tsconfig.json             # TypeScript configuration
├── .env.example                  # Environment variables template
├── docker-compose.yml            # Definition of multi-container for services in the project
├── Dockerfile                    # Dockerfile for backend service
├── export_docker.bat             # Script: Copy files required for Docker deployment
├── go.mod                        # Go module definition
├── main.go                       # Main server file
├── README.md                     # This file
└── run_dev.bat                   # Development startup script for Windows
```

## Features

- **REST API**: REST API service. Reference [API Documentation](#api-documentation) for details
- **Web Interface**: React frontend application

## Prerequisites

- Go `1.23.7` or higher
- Node.js and npm
- Internet connection for fetching dictionary data
- MySQL or PostgreSQL database

## Getting Started

### 1. Install Dependencies

Install the Go dependencies:

```bash
go mod tidy
```

Install the Node.js dependencies:

```bash
# Install Cambridge Dictionary API dependencies
cd utils/cambridge-dictionary-api
npm install
cd ../..

# Install React frontend dependencies
cd web
npm install
cd ..
```

### 2. Environment Configuration

Set up environment variables for both backend and frontend applications:

#### Backend Configuration (`.env`)

Create a `.env` file in the project root directory with the following configuration:

```env
# Services Port
# (They will also be used during Docker Compose operations)
APP_PORT=8080
CAMBRIDGE_API_PORT=8081
FRONTEND_PORT=3000

# Logging Configuration
# - Level: DEBUG, INFO, WARN, ERROR
LOG_FILE_PATH=word-flashcard.log
LOG_FILE_MAX_SIZE_MB=10
LOG_LEVEL=INFO

# Database Configuration
# Supported types: mysql, postgresql
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=word_flashcard
```

#### Frontend Configuration (`web/.env`)

Create a `.env` file in the `web/` directory with the following configuration:

```env
# API Configuration
REACT_APP_API_HOSTNAME=localhost
REACT_APP_API_PORT=8080
REACT_APP_API_HOSTNAME_DICTIONARY=localhost
REACT_APP_API_PORT_DICTIONARY=8081
```

For detailed database configuration and usage, see [Database Documentation](utils/database/README.md).

### 3. Start the Services

First, start the sub-service:

#### Cambridge Dictionary API
- The service will start on port `8081` by default.
```bash
cd utils/cambridge-dictionary-api
npm run dev
```

#### Main Service
- The service will start on port `8080` by default.
```bash
go run main.go
```

#### React Frontend
- The development server will start on port `3000` by default.
```bash
cd web
npm start
```

**Note**: All sub-services must be running before starting the main service to ensure full functionality.

### 4. Access the Application

- **Web Interface**: http://localhost:3000
- **API Endpoints**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger

### 5. Stop the Service

To stop the service, press `Ctrl+C` in the terminal where the service is running.

## API Documentation

The API documentation is available through Swagger UI in two ways:

- **Local Development**: http://localhost:8080/swagger (when the server is running locally)
- **Online Documentation**: https://fong0975.github.io/word-flashcard/ (automatically updated via GitHub Actions)


## Development

### Swagger API Documentation

When you modify API handlers or add new endpoints, you need to regenerate the Swagger documentation:

```bash
# Regenerate swagger documentation after API changes
swag init
```

This command will update the `docs/` directory with the latest API documentation based on your swagger annotations in the code.

### Format Code
```bash
# Check formatting issues
golangci-lint run
```

### Testing

Run unit tests for the entire project:
```bash
# Run all tests with verbose output
go test ./... -v

# Run tests for specific package
go test ./internal/controllers -v
go test ./internal/middleware -v
go test ./internal/routers -v

# Run tests with coverage report
go test ./... -cover

# Generate detailed coverage report
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Building the Application

To build the Go binary:

```bash
# Build the binary to dist directory
go build -o dist/word-flashcard main.go
```

To build the React frontend for production:

```bash
cd web
npm run build
```

The built React application will be available in the `web/build/` directory.

### Running the Binary

```bash
# Windows
./dist/word-flashcard.exe

# Linux/macOS
./dist/word-flashcard
```

## Docker Deployment

Use the Docker to deploy the services for the production environment.

1. Run the `export_docker.bat` script to copy files required by the Docker host into the `docker/` directory.
2. Clone `.env.example` and `web/.env.example` into `.env` and `web/.env` respectively, then modify their contents to suit the Docker container.

| File     | Variable                          | Description                                                                    | Sample Value                                                                                                      |
|----------|-----------------------------------|--------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| .env     | APP_PORT                          | Port for the main application service (default expose port for docker-compose) | 8080                                                                                                              |
| .env     | CAMBRIDGE_API_PORT                | Port for the Cambridge Dictionary API (default expose port for docker-compose) | 8081                                                                                                              |
| .env     | FRONTEND_PORT                     | Port for the React frontend service (default expose port for docker-compose)   | 3000                                                                                                              |
| .env     | LOG_FILE_PATH                     | Log file path inside the container                                             | logs/word-flashcard.log <br/> (Docker binds volumes by default, storing log files in the physical root directory) |
| web/.env | REACT_APP_API_HOSTNAME            | Hostname for the API service in the frontend                                   | api.flashcard.com                                                                                                 |
| web/.env | REACT_APP_API_PORT                | Port for the API service in the frontend configuration                         | 8080                                                                                                              |
| web/.env | REACT_APP_API_HOSTNAME_DICTIONARY | Hostname for the Cambridge Dictionary API in the frontend configuration        | dictionary.flashcard.com                                                                                          |
| web/.env | REACT_APP_API_PORT_DICTIONARY     | Port for the Cambridge Dictionary API in the frontend configuration            | 8081                                                                                                              |

3. Use `docker\docker-compose.yml` to build the Docker containers.
