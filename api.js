const express = require('express');
const path = require('path');

const api = express();  

// Serve static files from the React app
api.use(express.static(path.join(__dirname, 'public')));

api.use('/', express.static('index.html'));

module.exports = api;