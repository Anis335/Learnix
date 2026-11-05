const path = require('path');
const express = require('express');

// Load environment variables from backend/.env or root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const app = require('./app');

// Serve frontend static files
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

// Fallback for SPA routing if needed
app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Learnix website running at http://localhost:${port}`);
});
