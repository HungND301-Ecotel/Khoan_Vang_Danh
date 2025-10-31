import { Box, Card, CardContent, Skeleton } from '@mui/material'
import React from 'react'

export default function LoadingSkeleton() {
    return (
        <Box >
            {/* Toolbar skeleton */}
            < Box sx={{ mb: 2 }
            }>
                <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
                    <Box display={"flex"} gap={2}>
                        <Skeleton variant="rectangular" width={100} height={36} />
                        <Skeleton variant="rectangular" width={80} height={36} />
                    </Box>
                    <Box display={"flex"} flex={1} gap={2}>
                        <Skeleton variant="rectangular" width={60} height={36} />
                        <Skeleton variant="rectangular" height={36} sx={{ flex: 1 }} />
                    </Box>
                    <Box display={"flex"} gap={2}>
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} variant="rectangular" width={80} height={36} />
                        ))}
                    </Box>
                </Box>
            </Box >

            {/* Table skeleton */}
            < Card >
                <CardContent sx={{ p: 0 }}>
                    {[...Array(5)].map((_, index) => (
                        <Box key={index} sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Skeleton variant="rectangular" width={20} height={20} />
                                <Skeleton variant="text" width={50} />
                                <Skeleton variant="text" width={250} sx={{ flex: 1 }} />
                                <Skeleton variant="text" width={80} />
                                <Skeleton variant="circular" width={32} height={32} />
                            </Box>
                        </Box>
                    ))}
                </CardContent>
            </Card >
        </Box >
    )
}
