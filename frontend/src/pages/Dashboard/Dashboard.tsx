import { Box, Grid, Typography } from '@mui/material'
import React from 'react'
import MaterialChart from './MaterialChart/MaterialChart'
import CostProfitChart from './CostChart/CostChart'

export default function Dashboard() {

  return (
    <Box p={5}>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <MaterialChart />
        </Grid>
        <Grid item xs={12}>
          <CostProfitChart />
        </Grid>
      </Grid>
    </Box>
  )
}
