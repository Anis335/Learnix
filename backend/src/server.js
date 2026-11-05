const path = require('path');
const express = require('express');

// Load environment variables from backend/.env or root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const app = require('./app');

// Root API health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: "Backend server is running successfully!" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
