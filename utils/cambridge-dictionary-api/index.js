require('dotenv').config({ path: '../../.env' });
const http = require("http");
const data = require("./data");
const port = process.env.CAMBRIDGE_API_PORT || 8081;
const host = "0.0.0.0";

const server = http.createServer(data);

server.listen(port, host, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Try http://localhost:${port}/api/dictionary/en-tw/hello`);
  console.log("Or use / to test the API with UI");
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
