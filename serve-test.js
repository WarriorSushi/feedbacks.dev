const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'test-widget.html' : req.url);
  
  // Handle CSS and JS files
  if (req.url.startsWith('/packages/')) {
    filePath = path.join(__dirname, req.url);
  }
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch(extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Open http://localhost:8080 to test the widget');
});