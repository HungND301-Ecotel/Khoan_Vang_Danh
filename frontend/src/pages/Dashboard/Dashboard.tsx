import { Box, Grid, Typography } from '@mui/material'
import React from 'react'
import MaterialChart from './MaterialChart/MaterialChart'
import CostProfitChart from './CostChart/CostChart'
import CostCard from './CostCard/CostCard'

export default function Dashboard() {

  return (
    <Box px={5}>
      <Grid container spacing={2}>
        <Grid item xs={6} md={4}>
          <MaterialChart />
        </Grid>
        <Grid item xs={6} md={4}>
          <CostCard />
        </Grid>
        <Grid item xs={12}>
          <CostProfitChart />
        </Grid>
      </Grid>
    </Box>
  )
}
