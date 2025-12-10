const ModbusRTU = require("modbus-serial");
const fs = require('fs').promises;
const path = require('path');

class ModbusController {
  constructor(config, io) {
    this.config = config;
    this.io = io;
    this.clients = new Map();
    this.devices = [];
    this.realTimeData = new Map();
    this.isRunning = false;
    this.intervalId = null;
  }

  async initialize() {
    await this.loadDeviceConfig();
    await this.initializeModbusClients();
    this.startPolling();
  }

  async loadDeviceConfig() {
    try {
      const configData = await fs.readFile(this.config.DEVICE_CONFIG_FILE, 'utf8');
      this.devices = JSON.parse(configData);
      console.log(`Loaded ${this.devices.length} device configurations`);
    } catch (error) {
      console.log('No device config found, using default');
      this.devices = this.getDefaultDevices();
    }
  }

  getDefaultDevices() {
    return [
      {
        id: 1,
        name: "Power Analyzer 1",
        slaveId: 1,
        port: "/dev/ttyUSB0",
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        registers: {
          voltage: { address: 0, length: 2, multiplier: 0.1 },
          current: { address: 2, length: 2, multiplier: 0.01 },
          power: { address: 4, length: 2, multiplier: 0.1 },
          frequency: { address: 6, length: 1, multiplier: 0.01 },
          powerFactor: { address: 7, length: 1, multiplier: 0.001 }
        },
        enabled: true
      }
    ];
  }

  async initializeModbusClients() {
    // Group devices by port
    const devicesByPort = {};
    this.devices.forEach(device => {
      if (!device.enabled) return;
      if (!devicesByPort[device.port]) {
        devicesByPort[device.port] = [];
      }
      devicesByPort[device.port].push(device);
    });

    // Create client for each port
    for (const [port, portDevices] of Object.entries(devicesByPort)) {
      try {
        const client = new ModbusRTU();
        
        // Configure serial port [citation:1]
        await client.connectRTUBuffered(port, {
          baudRate: portDevices[0].baudRate,
          dataBits: portDevices[0].dataBits,
          stopBits: portDevices[0].stopBits,
          parity: portDevices[0].parity
        });

        client.setTimeout(1000);
        this.clients.set(port, client);
        console.log(`Connected to port: ${port}`);
      } catch (error) {
        console.error(`Failed to connect to port ${port}:`, error.message);
      }
    }
  }

  startPolling() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.pollAllDevices();
    }, this.config.UPDATE_INTERVAL);
  }

  async pollAllDevices() {
    for (const device of this.devices.filter(d => d.enabled)) {
      await this.pollDevice(device);
      // Small delay between devices to avoid overwhelming the bus
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async pollDevice(device) {
    const client = this.clients.get(device.port);
    if (!client) {
      console.error(`No client for port ${device.port}`);
      return;
    }

    try {
      // Set slave ID [citation:1]
      await client.setID(device.slaveId);

      const readings = {
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        values: {}
      };

      // Read all registers for this device
      for (const [parameter, config] of Object.entries(device.registers)) {
        try {
          const result = await client.readInputRegisters(config.address, config.length);
          
          // Convert register values to actual measurements
          let value;
          if (config.length === 1) {
            value = result.data[0] * config.multiplier;
          } else if (config.length === 2) {
            // Combine two 16-bit registers into 32-bit value
            const combined = (result.data[0] << 16) | result.data[1];
            value = combined * config.multiplier;
          }
          
          readings.values[parameter] = {
            value: value.toFixed(3),
            unit: this.getUnit(parameter),
            raw: result.data
          };
        } catch (regError) {
          readings.values[parameter] = {
            value: null,
            error: regError.message,
            unit: this.getUnit(parameter)
          };
        }
      }

      // Store real-time data
      this.realTimeData.set(device.id, readings);
      
      // Save to history
      await this.saveToHistory(device.id, readings);
      
      // Emit via WebSocket
      this.io.emit('device-update', readings);
      
    } catch (error) {
      console.error(`Error polling device ${device.id}:`, error.message);
      this.realTimeData.set(device.id, {
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  getUnit(parameter) {
    const units = {
      voltage: 'V',
      current: 'A',
      power: 'kW',
      frequency: 'Hz',
      powerFactor: ''
    };
    return units[parameter] || '';
  }

  async saveToHistory(deviceId, readings) {
    try {
      const historyFile = path.join(this.config.DATA_DIR, `device_${deviceId}.json`);
      
      let history = [];
      try {
        const existingData = await fs.readFile(historyFile, 'utf8');
        history = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist yet
      }

      // Add new reading
      history.push(readings);

      // Keep only last 24 hours of data
      const cutoffTime = new Date(Date.now() - (this.config.MAX_HISTORY_HOURS * 60 * 60 * 1000));
      history = history.filter(reading => new Date(reading.timestamp) > cutoffTime);

      await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Error saving history:', error.message);
    }
  }

  updateDeviceConfig(newDevices) {
    this.devices = newDevices;
    this.reinitializeClients();
  }

  async reinitializeClients() {
    // Close existing connections
    for (const client of this.clients.values()) {
      try {
        client.close();
      } catch (error) {
        // Ignore close errors
      }
    }
    this.clients.clear();
    
    // Reinitialize
    await this.initializeModbusClients();
  }

  getConnectedDevices() {
    return this.devices.filter(d => d.enabled).length;
  }

  getLastUpdateTime() {
    return new Date().toISOString();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
    }
    
    // Close all Modbus connections
    for (const client of this.clients.values()) {
      try {
        client.close();
      } catch (error) {
        // Ignore close errors
      }
    }
  }
}

module.exports = ModbusController;