const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello! Your Node server is officially running.');
});

// An Example API Route
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Online', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Server is sprinting at http://localhost:${PORT}`);
});
