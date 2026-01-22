# Word Flashcard

A language learning flashcard system built with Go, designed for quick word and question management.
The application features a REST API backend and an HTML frontend interface.

## Project Structure

```
word-flashcard/
├── dist/                          # Build output directory
├── docs/                          # Auto-generated Swagger API documentation
├── handlers/                      # HTTP Web handlers
├── internal/                      # Internal application code
│   ├── controllers/              # API controllers
│   ├── middleware/               # HTTP middleware
│   ├── models/                   # Data models
│   └── routers/                  # Route configuration
├── utils/                         # Utility modules
│   ├── cambridge-dictionary-api/ # Cambridge Dictionary API sub-service
│   ├── config/                   # Configuration module
│   ├── database/                 # Database module with MySQL/PostgreSQL support
│   ├── log/                      # Logging module
│   └── dictionary-testing.json   # Mockoon file for Cambridge Dictionary API sub-service
├── web/                           # Web frontend files
│   ├── static/                   # Static assets
│   └── templates/                # HTML templates
├── .env.example                  # Environment variables template
├── go.mod                        # Go module definition
├── main.go                       # Main server file
├── README.md                     # This file
└── run_dev.bat                   # Development startup script for Windows
```

## Features

- **REST API**: REST API service. Reference [API Documentation](#api-documentation) for details
- **Web Interface**: Project HTML page

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
# Change the directory
cd utils/cambridge-dictionary-api
# Install dependencies
npm install
# Return to the root directory
cd ../..
```

### 2. Database Setup

Set up database connection information in your project's `.env` file:

```env
# Database type (mysql or postgresql)
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=word_flashcard
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
**Note**: All sub-service must be running before starting the main service to ensure full functionality.

### 4. Access the Application

- **Web Interface**: http://localhost:8080
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

To build a binary:

```bash
# Build the binary to dist directory
go build -o dist/word-flashcard main.go
```

### Running the Binary

```bash
# Windows
./dist/word-flashcard.exe

# Linux/macOS
./dist/word-flashcard
```

