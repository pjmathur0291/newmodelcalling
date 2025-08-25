const app = require('./api/index.js');

// Initialize database
const db = require('./database-vercel');
db.initDatabase();

// Start server for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 View leads at http://localhost:${PORT}/api/leads`);
  console.log(`🌐 Embed form at http://localhost:${PORT}/embed`);
  console.log(`📱 Demo page at http://localhost:${PORT}/demo`);
  console.log(`⚙️ Admin dashboard at http://localhost:${PORT}/admin`);
});
