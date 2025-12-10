import React from 'react'
import { 
  Box, 
  Typography, 
  Chip, 
  CircularProgress,
  Tooltip,
  Paper
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Power as PowerIcon,
  Memory as MemoryIcon
} from '@mui/icons-material'

const SystemStatus = ({ status }) => {
  // Default status if none provided
  const defaultStatus = {
    status: 'running',
    connectedDevices: 0,
    lastUpdate: new Date().toISOString(),
    pollingInterval: 2000,
    errors: 0
  }

  const currentStatus = status || defaultStatus

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'running': return 'success'
      case 'stopped': return 'error'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'running': return <CheckIcon fontSize="small" />
      case 'stopped': return <ErrorIcon fontSize="small" />
      case 'warning': return <WarningIcon fontSize="small" />
      default: return <RefreshIcon fontSize="small" />
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const calculateUptime = () => {
    // For now, return a placeholder
    return '00:00:00'
  }

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 1.5, 
        backgroundColor: 'background.paper',
        minWidth: 300
      }}
    >
      <Box>
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          System Status
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Chip
            icon={getStatusIcon(currentStatus.status)}
            label={currentStatus.status?.toUpperCase() || 'UNKNOWN'}
            color={getStatusColor(currentStatus.status)}
            size="small"
            variant="outlined"
          />
          <Typography variant="caption" color="textSecondary">
            {formatTime(currentStatus.lastUpdate)}
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
          <Tooltip title="Connected Power Analyzers">
            <Box display="flex" alignItems="center" gap={0.5}>
              <PowerIcon fontSize="small" color="primary" />
              <Typography variant="caption">
                Devices: 
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {currentStatus.connectedDevices || 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Polling Interval">
            <Box display="flex" alignItems="center" gap={0.5}>
              <MemoryIcon fontSize="small" color="action" />
              <Typography variant="caption">
                Interval: 
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {(currentStatus.pollingInterval / 1000) || 2}s
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="System Uptime">
            <Box display="flex" alignItems="center" gap={0.5}>
              <CircularProgress size={12} thickness={5} />
              <Typography variant="caption">
                Uptime: 
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {calculateUptime()}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Error Count">
            <Box display="flex" alignItems="center" gap={0.5}>
              <ErrorIcon fontSize="small" color={currentStatus.errors > 0 ? 'error' : 'disabled'} />
              <Typography variant="caption">
                Errors: 
              </Typography>
              <Typography variant="caption" fontWeight="bold" color={currentStatus.errors > 0 ? 'error' : 'textSecondary'}>
                {currentStatus.errors || 0}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  )
}

export default SystemStatus