import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { Line } from 'react-chartjs-2'
import io from 'socket.io-client'

// Register ChartJS components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const socket = io('http://localhost:5000')

const RealTimeMonitor = () => {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [realTimeData, setRealTimeData] = useState([])

  useEffect(() => {
    fetchDevices()
    
    // Listen for real-time updates
    socket.on('device-update', (data) => {
      if (!selectedDevice || data.deviceId !== selectedDevice.id) return
      
      setRealTimeData(prev => {
        const newData = [...prev, data]
        // Keep only last 50 data points
        return newData.slice(-50)
      })
    })

    return () => {
      socket.off('device-update')
    }
  }, [selectedDevice])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices')
      const data = await response.json()
      const enabledDevices = data.filter(d => d.enabled)
      setDevices(enabledDevices)
      if (enabledDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(enabledDevices[0])
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const getChartData = () => {
    const labels = realTimeData.map(d => 
      new Date(d.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    )

    return {
      labels,
      datasets: [
        {
          label: 'Voltage (V)',
          data: realTimeData.map(d => parseFloat(d.values?.voltage?.value || 0)),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Current (A)',
          data: realTimeData.map(d => parseFloat(d.values?.current?.value || 0)),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Power (kW)',
          data: realTimeData.map(d => parseFloat(d.values?.power?.value || 0)),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          fill: true
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: selectedDevice ? `Real-time Data - ${selectedDevice.name}` : 'Real-time Monitoring'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    },
    animation: {
      duration: 0
    }
  }

  const handleRefresh = () => {
    setRealTimeData([])
    fetchDevices()
  }

  const getLatestValues = () => {
    if (realTimeData.length === 0) return null
    return realTimeData[realTimeData.length - 1]
  }

  const latestData = getLatestValues()

  return (
    <Grid container spacing={3}>
      {/* Controls Panel */}
      <Grid item xs={12} md={3}>
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Monitor Controls
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Device</InputLabel>
            <Select
              value={selectedDevice?.id || ''}
              onChange={(e) => {
                const device = devices.find(d => d.id === e.target.value)
                setSelectedDevice(device)
                setRealTimeData([])
              }}
              label="Select Device"
            >
              {devices.map(device => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" gap={1} mt={2}>
            <IconButton
              onClick={() => setIsPlaying(!isPlaying)}
              color={isPlaying ? 'primary' : 'default'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            
            <IconButton
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshIcon />
            </IconButton>
          </Box>

          {latestData && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Latest Values
              </Typography>
              {latestData.values && Object.entries(latestData.values).map(([key, value]) => (
                <Card key={key} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      {key.toUpperCase()}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {value.value} {value.unit}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Chart Panel */}
      <Grid item xs={12} md={9}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box height="400px">
            <Line data={getChartData()} options={chartOptions} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default RealTimeMonitor