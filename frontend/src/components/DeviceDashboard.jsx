import React, { useState, useEffect } from 'react'
import {
  Paper,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip
} from '@mui/material'
import {
  Bolt as BoltIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { Line } from 'react-chartjs-2'
import io from 'socket.io-client'

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const socket = io(BACKEND_URL)

const DeviceDashboard = () => {
  const [devices, setDevices] = useState([])
  const [deviceData, setDeviceData] = useState({})

  useEffect(() => {
    fetchDevices()
    
    socket.on('device-update', (data) => {
      setDeviceData(prev => ({
        ...prev,
        [data.deviceId]: data
      }))
    })

    return () => {
      socket.off('device-update')
    }
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices')
      const data = await response.json()
      setDevices(data.filter(d => d.enabled))
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const getChartData = (deviceId) => {
    const data = deviceData[deviceId]
    if (!data || !data.values) {
      return {
        labels: [],
        datasets: []
      }
    }

    return {
      labels: ['Voltage', 'Current', 'Power'],
      datasets: [
        {
          label: 'Values',
          data: [
            parseFloat(data.values.voltage?.value || 0),
            parseFloat(data.values.current?.value || 0),
            parseFloat(data.values.power?.value || 0)
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(53, 162, 235, 0.5)',
            'rgba(75, 192, 192, 0.5)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(53, 162, 235)',
            'rgb(75, 192, 192)'
          ],
          borderWidth: 1
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <Grid container spacing={3}>
      {devices.map(device => {
        const data = deviceData[device.id] || {}
        
        return (
          <Grid item xs={12} md={6} lg={4} key={device.id}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  <BoltIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {device.name}
                </Typography>
                <Chip 
                  label={device.location || 'Unknown'} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>

              {data.error ? (
                <Box display="flex" alignItems="center" justifyContent="center" height="100px">
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="error">
                    Connection Error
                  </Typography>
                </Box>
              ) : (
                <>
                  <Grid container spacing={1} mb={2}>
                    {data.values && Object.entries(data.values).map(([key, param]) => (
                      <Grid item xs={6} key={key}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {key.toUpperCase()}
                            </Typography>
                            <Box display="flex" alignItems="center">
                              <Typography variant="h6" component="span" fontWeight="bold">
                                {param.value || '--'}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                                {param.unit}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Box height="200px">
                    <Line data={getChartData(device.id)} options={chartOptions} />
                  </Box>
                </>
              )}

              <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  Last update: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Never'}
                </Typography>
                <Chip
                  label={data.error ? 'Error' : 'Connected'}
                  color={data.error ? 'error' : 'success'}
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default DeviceDashboard