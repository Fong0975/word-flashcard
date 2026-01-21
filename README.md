# Word Flashcard

A language learning flashcard system built with Go, designed for quick word and question management.
The application features a REST API backend and an HTML frontend interface.

## Project Structure

```
word-flashcard/
├── api/                           # REST API handlers
├── dist/                          # Build output directory
├── handlers/                      # HTTP Web handlers
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

### 5. Stop the Service

To stop the service, press `Ctrl+C` in the terminal where the service is running.

## API Documentation

<table>
<thead>
<tr>
<th>Method</th>
<th>Path</th>
<th>Description</th>
<th>Request</th>
<th>Response</th>
</tr>
</thead>
<tbody>
<tr>
<td>GET</td>
<td><code>/api/status</code></td>
<td>Returns the current status of the service</td>
<td>None</td>
<td>

```json
{
    "status": "OK",
    "message": "Hello World! Service is running normally"
}
```

</td>
</tr>
<tr>
<td>GET</td>
<td><code>/api/dictionary/{word}</code></td>
<td>Fetches English word data</td>
<td>Path params:<br><code>word</code> (string) - The word to lookup</td>
<td>

```json
{
    "phonetics": [
        {
            "language": "uk",
            "audio": "https://dictionary.cambridge.org/us/media/english-chinese-traditional/uk_pron/u/ukg/ukgan/ukganja011.mp3"
        },
        {
            "language": "us",
            "audio": "https://dictionary.cambridge.org/us/media/english-chinese-traditional/us_pron/g/gar/garag/garage.mp3"
        }
    ],
    "meanings": [
        {
            "partOfSpeech": "noun",
            "definitions": [
                {
                    "definition": "車庫，汽車房 A building where a car is kept, built next to or as part of a house",
                    "example": ["Did you put the car in the garage? 你把車停到車庫裡了嗎？"]
                },
                {
                    "definition": "汽車修理廠 A place where cars are repaired",
                    "example": ["The car's still at the garage getting fixed. 車還在汽車修理廠維修呢。"]
                }
            ]
        },
        {
            "partOfSpeech": "verb",
            "definitions": [
                {
                    "definition": "把車停在車庫裡 to put or keep a vehicle in a garage",
                    "example": ["If your car is garaged, you get much cheaper insurance. 如果你把車停放在車庫裡，你買汽車保險時就能省很多錢。"]
                }
            ]
        }
    ]
}
```

</td>
</tr>
</tbody>
</table>


## Development

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
go test ./api -v

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

