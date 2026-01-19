# Word Flashcard Service

A simple Go web service that provides a REST API and HTML interface for a basic "Hello World" demonstration.

## Project Structure

```
word-flashcard/
├── api/
│   └── status.go          # REST API handlers
├── handlers/
│   └── web.go            # Web page handlers
├── web/
│   ├── static/
│   │   ├── app.js        # JavaScript for API interaction
│   │   └── style.css     # Styling
│   └── templates/
│       └── index.html    # HTML template
├── dist/                 # Build output directory
├── main.go               # Main server file
├── go.mod               # Go module definition
└── README.md           # This file
```

## Features

- **REST API**: Provides RESTful endpoints for various functionalities
- **Web Interface**: HTML page that can fetch and display API status

## Prerequisites

- Go `1.19` or higher
- No external dependencies required (uses only Go standard library)

## Getting Started

### 1. Install Dependencies

Since this project only uses Go's standard library, no additional packages need to be installed:

```bash
go mod tidy
```

### 2. Start the Service

To start the web service:

```bash
go run main.go
```

The service will start on port 8080 by default.

### 3. Access the Application

- **Web Interface**: http://localhost:8080
- **API Endpoints**: http://localhost:8080/api

### 4. Stop the Service

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
</tbody>
</table>

## Development

### Format Code
```bash
# Check formatting issues
golangci-lint run
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

## Usage

1. Start the service using `go run main.go`
2. Open your web browser and navigate to http://localhost:8080
3. Click the "Check API Status" button to test the REST API integration
4. The page will display the status response from the API

## Notes

- The service runs on port 8080 by default
- All API responses include CORS headers for cross-origin requests
- Static files are served from the `/static/` path
- Templates are loaded from the `web/templates/` directory