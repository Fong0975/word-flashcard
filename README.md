# Word Flashcard

[![Go](https://img.shields.io/badge/Go-1.26.10%2B-00ADD8?logo=go&logoColor=white)](https://go.dev/dl/)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-required-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-supported-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

![Preview](assets/preview.jpg)

A personal language learning app for building vocabulary and practising with quizzes. Manage your own word cards, custom multiple-choice questions and markdown notes, then test yourself to track your progress.

Look up a word with the Gemini API to import its definitions in one click, mark your familiarity level, and review statistics charts of your learning progress.

## Project Structure

```
word-flashcard/
├── .claude/commands/              # Project-specific Claude Code custom commands
├── backups/                       # [Backend API] Automatic backup output (created at runtime, not committed)
├── data/                          # [Backend API] Database peers, models and schema
├── dist/                          # [Backend API] Go binary build output
├── docs/                          # [Backend API] Auto-generated Swagger API documentation
├── internal/                      # [Backend API] Controllers, middleware, routers and scheduler
├── project-docs/                  # Project documentation (e.g. design system)
├── scripts/                       # Helper scripts
├── utils/                         # [Backend API] Config, database, logging and helper modules
└── web/                           # React frontend application
    ├── public/                    # Public assets
    └── src/                       # React source code
```

## Getting Started

### 1. Install Dependencies

Install the Go dependencies:

```bash
go mod tidy
```

Install the Node.js dependencies:

```bash
# Install React frontend dependencies
cd web
npm install
cd ..
```

### 2. Environment Configuration

Set up environment variables for both backend and frontend applications:

#### Backend Configuration (`.env`)

Copy `.env.example` to `.env` in the project root and fill in the values (server ports, CORS, logging, automatic backup, Gemini API key and database connection). Each variable is documented in the file itself.

> **MySQL Charset Requirement**: The database must use `utf8mb4` character set to support full Unicode content (including emoji and multi-byte characters). Use the following SQL when creating the database:
> ```sql
> CREATE DATABASE word_flashcard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> ```

#### Getting a Gemini API Key

The dictionary lookup feature (`GEMINI_API_KEY` above) needs a free Gemini API key:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key**, then pick or create a Google Cloud project when prompted.
3. Copy the generated key into `GEMINI_API_KEY` in your `.env` file.

The free tier is more than enough for personal use, and no credit card is required. Keep the key private -- anyone with it can make requests billed to your account.

#### Frontend Configuration (`web/.env`)

Copy `web/.env.example` to `web/.env` and set the API host and port (`VITE_API_HOSTNAME`, `VITE_API_PORT`) to point at your backend.

For detailed database configuration and usage, see [Database Documentation](utils/database/README.md).

### 3. Start the Services

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

### Code Quality

#### Backend

```bash
# Run golangci-lint to check for code quality and formatting issues
golangci-lint run

# Run golangci-lint with automatic fixes for fixable issues
golangci-lint run --fix
```

#### Frontend

```bash
# Navigate to the web directory
cd web

# ESLint commands (includes Prettier formatting checks and Tailwind CSS linting)
# Run ESLint to check for code quality issues, formatting, and Tailwind CSS class validation
npm run lint

# Run ESLint with automatic fixes for fixable issues
npm run lint:fix

# Run ESLint in strict mode (fail if there are any warnings)
npm run lint:check

# Pure Prettier commands (faster for formatting-only operations)
# Run Prettier to format code and sort Tailwind CSS classes automatically
npm run format

# Check if code is formatted correctly without making changes
npm run format:check

# Show which files would be changed by Prettier
npm run format:diff

# TypeScript type checking (Vite and Vitest do not check types)
# Run the TypeScript compiler without emitting files and report type errors
npm run type-check
```

**Note**: ESLint commands include code quality checks, Prettier formatting rules, and Tailwind CSS class validation (classnames order, custom class detection, conflicting classes). Use pure Prettier commands when you only need fast formatting operations without code quality analysis. Run `npm run type-check` to catch TypeScript type errors, since neither `vite build` nor Vitest performs type checking.

### Testing

#### Backend

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

#### Frontend

```bash
# Navigate to the web directory
cd web

# Run all tests once without coverage
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run all tests once with a coverage report
npm run test:ci

# Run all tests once with a coverage report
# (used by the CI GitHub Actions workflow, which adds JSON reporter flags to post results on pull requests)
npm run test:coverage
```

### Dependency Vulnerability Scanning

#### Backend

```bash
# Install govulncheck (one-time)
go install golang.org/x/vuln/cmd/govulncheck@latest

# Scan Go dependencies (go.mod) for known vulnerabilities
govulncheck ./...
```

#### Frontend

```bash
# Navigate to the web directory
cd web

# Scan npm dependencies (package.json) for known vulnerabilities (high/critical only)
npm audit --audit-level=high
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
