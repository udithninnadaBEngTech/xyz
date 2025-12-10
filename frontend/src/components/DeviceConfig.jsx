import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Card,
  CardContent
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

const DeviceConfig = () => {
  const [devices, setDevices] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices')
      const data = await response.json()
      setDevices(data.length > 0 ? data : [getNewDeviceTemplate()])
    } catch (error) {
      console.error('Error fetching devices:', error)
      setDevices([getNewDeviceTemplate()])
    }
  }

  const getNewDeviceTemplate = () => ({
    id: Date.now(),
    name: `Power Analyzer ${devices.length + 1}`,
    slaveId: 1,
    port: 'COM1',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    description: '',
    location: '',
    enabled: true,
    registers: {
      voltage: { address: 0, length: 2, multiplier: 0.1, description: 'Voltage' },
      current: { address: 2, length: 2, multiplier: 0.01, description: 'Current' },
      power: { address: 4, length: 2, multiplier: 0.1, description: 'Power' }
    }
  })

  const handleAddDevice = () => {
    setDevices([...devices, getNewDeviceTemplate()])
  }

  const handleRemoveDevice = (index) => {
    const newDevices = [...devices]
    newDevices.splice(index, 1)
    setDevices(newDevices)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(devices)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' })
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Device Configuration
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchDevices}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Reload
          </Button>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type || 'info'} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {devices.map((device, deviceIndex) => (
        <Card key={device.id} variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Device {deviceIndex + 1}: {device.name}
              </Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={device.enabled}
                      onChange={(e) => {
                        const newDevices = [...devices]
                        newDevices[deviceIndex].enabled = e.target.checked
                        setDevices(newDevices)
                      }}
                    />
                  }
                  label="Enabled"
                />
                <IconButton
                  onClick={() => handleRemoveDevice(deviceIndex)}
                  color="error"
                  disabled={devices.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Device Name"
                  value={device.name}
                  onChange={(e) => {
                    const newDevices = [...devices]
                    newDevices[deviceIndex].name = e.target.value
                    setDevices(newDevices)
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Slave ID"
                  type="number"
                  value={device.slaveId}
                  onChange={(e) => {
                    const newDevices = [...devices]
                    newDevices[deviceIndex].slaveId = parseInt(e.target.value)
                    setDevices(newDevices)
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Serial Port"
                  value={device.port}
                  onChange={(e) => {
                    const newDevices = [...devices]
                    newDevices[deviceIndex].port = e.target.value
                    setDevices(newDevices)
                  }}
                  margin="normal"
                  helperText="e.g., COM1, COM2, /dev/ttyUSB0"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Baud Rate</InputLabel>
                  <Select
                    value={device.baudRate}
                    onChange={(e) => {
                      const newDevices = [...devices]
                      newDevices[deviceIndex].baudRate = e.target.value
                      setDevices(newDevices)
                    }}
                    label="Baud Rate"
                  >
                    <MenuItem value={9600}>9600</MenuItem>
                    <MenuItem value={19200}>19200</MenuItem>
                    <MenuItem value={38400}>38400</MenuItem>
                    <MenuItem value={57600}>57600</MenuItem>
                    <MenuItem value={115200}>115200</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      <Box display="flex" justifyContent="center" mt={3}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddDevice}
          variant="outlined"
          size="large"
        >
          Add New Device
        </Button>
      </Box>
    </Paper>
  )
}

export default DeviceConfig