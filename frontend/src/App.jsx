import React, { useState, useEffect } from 'react'
import { Container, Grid, Typography, Paper, Box } from '@mui/material'
import DeviceDashboard from './components/DeviceDashboard'
import DeviceConfig from './components/DeviceConfig'
import RealTimeMonitor from './components/RealTimeMonitor'
import SystemStatus from './components/SystemStatus'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [systemStatus, setSystemStatus] = useState({})

  useEffect(() => {
    // Fetch system status
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status')
        const data = await response.json()
        setSystemStatus(data)
      } catch (error) {
        console.error('Error fetching system status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Container maxWidth="xl" className="app-container">
      {/* Header */}
      <Paper elevation={3} className="header-paper">
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            ⚡ Power Analyzer Monitoring System
          </Typography>
          <SystemStatus status={systemStatus} />
        </Box>
      </Paper>

      {/* Navigation Tabs */}
      <Box className="tabs-container" mb={3}>
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'realtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('realtime')}
        >
          🔴 Real-time Monitor
        </button>
        <button
          className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Configuration
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📈 History
        </button>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {activeTab === 'dashboard' && <DeviceDashboard />}
          {activeTab === 'realtime' && <RealTimeMonitor />}
          {activeTab === 'config' && <DeviceConfig />}
          {activeTab === 'history' && (
            <Paper elevation={2} className="content-paper">
              <Typography variant="h5" gutterBottom>
                Historical Data Analysis
              </Typography>
              <Typography color="textSecondary">
                Historical data is automatically saved in JSON files for each device.
                You can access them via the API: /api/history/{'{deviceId}'}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Footer */}
      <Box mt={4} pt={2} borderTop={1} borderColor="divider">
        <Typography variant="body2" color="textSecondary" align="center">
          Power Monitoring System v1.0 • Real-time Modbus RTU Monitoring
        </Typography>
      </Box>
    </Container>
  )
}

export default App