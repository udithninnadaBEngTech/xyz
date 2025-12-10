const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Import Modbus controller
const ModbusController = require('./controllers/modbusController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React dev server
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const CONFIG = {
  PORT: 5000,
  DATA_DIR: path.join(__dirname, 'data'),
  DEVICE_CONFIG_FILE: path.join(__dirname, 'config', 'devices.json'),
  UPDATE_INTERVAL: 2000, // 2 seconds
  MAX_HISTORY_HOURS: 24
};

// Ensure directories exist
(async () => {
  await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
  await fs.mkdir(path.dirname(CONFIG.DEVICE_CONFIG_FILE), { recursive: true });
})();

// Initialize Modbus Controller
const modbusController = new ModbusController(CONFIG, io);
modbusController.initialize();

// API Routes
app.get('/api/devices', async (req, res) => {
  try {
    const configData = await fs.readFile(CONFIG.DEVICE_CONFIG_FILE, 'utf8');
    const devices = JSON.parse(configData);
    res.json(devices);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const devices = req.body;
    await fs.writeFile(CONFIG.DEVICE_CONFIG_FILE, JSON.stringify(devices, null, 2));
    modbusController.updateDeviceConfig(devices);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/:deviceId', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const historyFile = path.join(CONFIG.DATA_DIR, `device_${deviceId}.json`);
    
    try {
      const historyData = await fs.readFile(historyFile, 'utf8');
      res.json(JSON.parse(historyData));
    } catch {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    connectedDevices: modbusController.getConnectedDevices(),
    lastUpdate: modbusController.getLastUpdateTime()
  });
});

// Start server
server.listen(CONFIG.PORT, () => {
  console.log(`Backend server running on port ${CONFIG.PORT}`);
});