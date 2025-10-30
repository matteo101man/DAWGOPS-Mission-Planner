// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get all symbols (PNG files) from the symbols directory
app.get('/api/symbols', (req, res) => {
  const symbolsDir = path.join(__dirname, 'public', 'symbols');
  
  // Read the directory
  fs.readdir(symbolsDir, (err, files) => {
    if (err) {
      console.error('Error reading symbols directory:', err);
      return res.status(500).json({ error: 'Error reading symbols directory' });
    }
    
    // Filter for PNG files
    const symbols = files.filter(file => file.toLowerCase().endsWith('.png'));
    
    res.json({ symbols });
  });
});

// Endpoint to get list of saved files
app.get('/api/saves', (req, res) => {
  const savesDir = path.join(__dirname, 'saves');
  
  // Create saves directory if it doesn't exist
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
  
  fs.readdir(savesDir, (err, files) => {
    if (err) {
      console.error('Error reading saves directory:', err);
      return res.status(500).json({ error: 'Error reading saves directory' });
    }
    
    // Filter for JSON files
    const saves = files.filter(file => file.toLowerCase().endsWith('.json'));
    
    res.json({ saves });
  });
});

// Endpoint to save mission data
app.post('/api/save', (req, res) => {
  const { filename, data } = req.body;
  
  if (!filename || !data) {
    return res.status(400).json({ error: 'Filename and data are required' });
  }
  
  const savesDir = path.join(__dirname, 'saves');
  
  // Create saves directory if it doesn't exist
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
  
  const filePath = path.join(savesDir, `${filename}.json`);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Mission saved successfully' });
  } catch (error) {
    console.error('Error saving mission:', error);
    res.status(500).json({ error: 'Error saving mission' });
  }
});

// Endpoint to load mission data
app.get('/api/load/:filename', (req, res) => {
  const { filename } = req.params;
  const savesDir = path.join(__dirname, 'saves');
  const filePath = path.join(savesDir, `${filename}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Save file not found' });
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const missionData = JSON.parse(data);
    
    res.json({ success: true, data: missionData });
  } catch (error) {
    console.error('Error loading mission:', error);
    res.status(500).json({ error: 'Error loading mission' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Open the browser automatically using dynamic import
  const open = await import('open');
  open.default(`http://localhost:${PORT}`);
});