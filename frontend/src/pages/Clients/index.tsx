import React, { useState } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Button,
  TablePagination,
  Skeleton,
} from '@mui/material';
import {
  SearchRounded,
  EditRounded,
  DeleteRounded,
  AddRounded,
  PhoneRounded,
  EmailRounded,
  FilterListRounded,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api';
import { AppLayout } from '../../components/Layout/AppLayout';
import { PageHeader } from '../../components/Common/PageHeader';
import { StatusChip } from '../../components/Common/StatusChip';
import { ClientDrawer } from './ClientDrawer';
import { Client } from '../../types';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

const CLIENT_STATUSES = ['NEW', 'ACTIVE', 'NOT_INTERESTED', 'CONVERTED', 'LOST'];
const LEAD_SOURCES = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'REFERRAL', 'PORTAL', 'OTHER'];

export const Clients: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { search, status: statusFilter, leadSource: sourceFilter, page: page + 1, limit: rowsPerPage }],
    queryFn: () =>
      clientsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        leadSource: sourceFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }).then((r) => r.data),
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      enqueueSnackbar('Client deleted', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to delete client', { variant: 'error' }),
  });

  const handleOpenClient = (client?: Client) => {
    setSelectedClient(client || null);
    setDrawerOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this client?')) deleteMutation.mutate(id);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Clients"
        subtitle={data ? `${data.total} total` : undefined}
        action={{ label: 'New Client', onClick: () => handleOpenClient() }}
      >
        {/* Filters */}
        <TextField
          size="small"
          placeholder="Search name, phone, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>,
          }}
          sx={{ width: 260 }}
        />
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ width: 130 }}
          label="Status"
        >
          <MenuItem value="">All</MenuItem>
          {CLIENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField
          select
          size="small"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
          sx={{ width: 130 }}
          label="Source"
        >
          <MenuItem value="">All</MenuItem>
          {LEAD_SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </PageHeader>

      <Card>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Deals</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.data.map((client) => (
                    <TableRow
                      key={client.id}
                      hover
                      onClick={() => handleOpenClient(client)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {client.fullName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {client.fullName}
                            </Typography>
                            {client.tags?.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                {client.tags.slice(0, 2).map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{ height: 16, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneRounded sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption">{client.phone}</Typography>
                          </Box>
                          {client.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailRounded sx={{ fontSize: 12, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusChip value={client.status} type="clientStatus" />
                      </TableCell>
                      <TableCell>
                        {client.leadSource && (
                          <Chip
                            label={client.leadSource}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {client.agent?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {client._count?.deals || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(client.createdAt), 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleOpenClient(client); }}
                            >
                              <EditRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => handleDelete(e, client.id)}
                            >
                              <DeleteRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>

        {data && (
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        )}
      </Card>

      <ClientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        client={selectedClient}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
      />
    </AppLayout>
  );
};
