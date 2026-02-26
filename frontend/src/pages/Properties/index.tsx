import React, { useState } from 'react';
import {
  Box,
  Card,
  Grid,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Skeleton,
  TablePagination,
  Stack,
} from '@mui/material';
import {
  SearchRounded,
  EditRounded,
  DeleteRounded,
  BedRounded,
  SquareFootRounded,
  StairsRounded,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../../api';
import { AppLayout } from '../../components/Layout/AppLayout';
import { PageHeader } from '../../components/Common/PageHeader';
import { StatusChip } from '../../components/Common/StatusChip';
import { PropertyDrawer } from './PropertyDrawer';
import { Property } from '../../types';
import { useSnackbar } from 'notistack';

const PROPERTY_STATUSES = ['ACTIVE', 'UNDER_OFFER', 'RENTED', 'SOLD', 'ARCHIVED'];

export const Properties: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['properties', { search, status: statusFilter, page: page + 1, limit: rowsPerPage }],
    queryFn: () =>
      propertiesApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }).then((r) => r.data),
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      enqueueSnackbar('Property deleted', { variant: 'success' });
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to delete', { variant: 'error' }),
  });

  const handleOpen = (property?: Property) => {
    setSelectedProperty(property || null);
    setDrawerOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Properties"
        subtitle={data ? `${data.total} total` : undefined}
        action={{ label: 'New Property', onClick: () => handleOpen() }}
      >
        <TextField
          size="small"
          placeholder="Search title, address..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>,
          }}
          sx={{ width: 240 }}
        />
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ width: 140 }}
          label="Status"
        >
          <MenuItem value="">All Statuses</MenuItem>
          {PROPERTY_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </PageHeader>

      <Grid container spacing={2.5}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Card>
                  <Skeleton variant="rectangular" height={180} />
                  <CardContent>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" width="40%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : data?.data.map((property) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={property.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                  }}
                  onClick={() => handleOpen(property)}
                >
                  {/* Photo */}
                  {property.photos?.[0] ? (
                    <CardMedia
                      component="img"
                      height={180}
                      image={property.photos[0].url}
                      alt={property.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 180,
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.disabled">No photos</Typography>
                    </Box>
                  )}

                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1 }}>
                        {property.title}
                      </Typography>
                      <StatusChip value={property.status} type="propertyStatus" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mb: 1 }}>
                      {property.address}
                    </Typography>

                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                      {property.currency === 'ILS' ? '₪' : '$'}
                      {Number(property.price).toLocaleString()}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      {property.rooms && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <BedRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{property.rooms}</Typography>
                        </Box>
                      )}
                      {property.sizeSqm && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <SquareFootRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{property.sizeSqm}m²</Typography>
                        </Box>
                      )}
                      {property.floor !== undefined && property.floor !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <StairsRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">Floor {property.floor}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  {/* Actions overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'none',
                      '.MuiCard-root:hover &': { display: 'flex' },
                      gap: 0.5,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                      onClick={() => handleOpen(property)}
                    >
                      <EditRounded fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                      onClick={() => {
                        if (confirm('Delete this property?')) deleteMutation.mutate(property.id);
                      }}
                    >
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
      </Grid>

      {data && (
        <Box sx={{ mt: 2 }}>
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[12, 24, 48]}
          />
        </Box>
      )}

      <PropertyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        property={selectedProperty}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['properties'] })}
      />
    </AppLayout>
  );
};
