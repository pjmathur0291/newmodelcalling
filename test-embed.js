const express = require('express');
const app = express();

// Simple test server to verify embed route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/embed', (req, res) => {
  res.json({ 
    message: 'Embed route is working!',
    query: req.query,
    url: req.url
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test embed route: http://localhost:${PORT}/embed`);
});
