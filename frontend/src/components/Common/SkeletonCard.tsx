import React from 'react';
import { Box, Skeleton, Card } from '@mui/material';

export const SkeletonCard: React.FC = () => (
  <Card sx={{ p: 2 }}>
    <Skeleton variant="text" width="60%" height={28} />
    <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
      <Skeleton variant="rounded" width={60} height={22} />
      <Skeleton variant="rounded" width={80} height={22} />
    </Box>
  </Card>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, i) => (
      <Box
        key={i}
        sx={{
          display: 'flex',
          gap: 2,
          py: 1.5,
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          alignItems: 'center',
        }}
      >
        <Skeleton variant="circular" width={36} height={36} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="20%" height={16} />
        </Box>
        <Skeleton variant="rounded" width={80} height={22} />
        <Skeleton variant="rounded" width={80} height={22} />
      </Box>
    ))}
  </Box>
);
