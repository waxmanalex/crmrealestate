import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Autocomplete,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
} from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, clientsApi, propertiesApi, tasksApi } from '../../api';
import { Deal, DealStage, Task } from '../../types';
import { useSnackbar } from 'notistack';
import { StatusChip } from '../../components/Common/StatusChip';
import { format, isPast } from 'date-fns';

interface DealModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
  onSaved: () => void;
}

const STAGES: DealStage[] = ['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED'];

export const DealModal: React.FC<DealModalProps> = ({ open, onClose, deal, onSaved }) => {
  const [form, setForm] = useState<Partial<Deal>>({});
  const [clientSearch, setClientSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!deal;

  useEffect(() => {
    if (deal) {
      setForm({
        clientId: deal.clientId,
        propertyId: deal.propertyId,
        stage: deal.stage,
        value: deal.value,
        probability: deal.probability,
        assignedTo: deal.assignedTo,
        nextActionAt: deal.nextActionAt,
        lostReason: deal.lostReason,
      });
    } else {
      setForm({ stage: 'NEW_LEAD' });
    }
  }, [deal, open]);

  const { data: clientsData } = useQuery({
    queryKey: ['clients-search', clientSearch],
    queryFn: () => clientsApi.getAll({ search: clientSearch, limit: 20 }).then((r) => r.data.data),
    staleTime: 10000,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-search', propertySearch],
    queryFn: () => propertiesApi.getAll({ search: propertySearch, limit: 20 }).then((r) => r.data.data),
    staleTime: 10000,
  });

  const { data: dealDetail } = useQuery({
    queryKey: ['deal', deal?.id],
    queryFn: () => dealsApi.getOne(deal!.id).then((r) => r.data),
    enabled: !!deal,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        nextActionAt: form.nextActionAt || undefined,
      };
      return isEdit
        ? dealsApi.update(deal!.id, payload)
        : dealsApi.create(payload);
    },
    onSuccess: () => {
      onSaved();
      enqueueSnackbar(isEdit ? 'Deal updated' : 'Deal created', { variant: 'success' });
      onClose();
    },
    onError: (err: any) => enqueueSnackbar(err?.response?.data?.message || 'Failed to save deal', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => dealsApi.delete(deal!.id),
    onSuccess: () => {
      onSaved();
      enqueueSnackbar('Deal deleted', { variant: 'success' });
      onClose();
    },
    onError: () => enqueueSnackbar('Failed to delete deal', { variant: 'error' }),
  });

  const selectedClient = clientsData?.find((c) => c.id === form.clientId) || deal?.client;
  const selectedProperty = propertiesData?.find((p) => p.id === form.propertyId) || deal?.property;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          {isEdit ? 'Edit Deal' : 'New Deal'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseRounded /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Client */}
          <Autocomplete
            options={clientsData || []}
            getOptionLabel={(c) => c.fullName}
            value={selectedClient || null}
            onInputChange={(_, v) => setClientSearch(v)}
            onChange={(_, c) => setForm((f) => ({ ...f, clientId: c?.id }))}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label="Client *" size="small" />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.light', fontSize: '0.75rem' }}>
                  {option.fullName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{option.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                </Box>
              </Box>
            )}
          />

          {/* Property */}
          <Autocomplete
            options={propertiesData || []}
            getOptionLabel={(p) => p.title}
            value={selectedProperty || null}
            onInputChange={(_, v) => setPropertySearch(v)}
            onChange={(_, p) => setForm((f) => ({ ...f, propertyId: p?.id }))}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label="Property (optional)" size="small" />
            )}
          />

          {/* Stage */}
          <TextField
            select
            label="Stage"
            value={form.stage || 'NEW_LEAD'}
            onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as DealStage }))}
            fullWidth
            size="small"
          >
            {STAGES.map((s) => (
              <MenuItem key={s} value={s}>
                <StatusChip value={s} type="dealStage" />
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Value"
              type="number"
              value={form.value || ''}
              onChange={(e) => setForm((f) => ({ ...f, value: parseFloat(e.target.value) }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Probability %"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={form.probability ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, probability: parseInt(e.target.value) }))}
              fullWidth
              size="small"
            />
          </Box>

          <TextField
            label="Next Action"
            type="datetime-local"
            value={form.nextActionAt ? form.nextActionAt.slice(0, 16) : ''}
            onChange={(e) => setForm((f) => ({ ...f, nextActionAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          {form.stage === 'CLOSED' && (
            <TextField
              label="Lost Reason (if applicable)"
              value={form.lostReason || ''}
              onChange={(e) => setForm((f) => ({ ...f, lostReason: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          )}

          {/* Activity timeline for existing deals */}
          {isEdit && dealDetail?.activities && dealDetail.activities.length > 0 && (
            <>
              <Divider />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Recent Activity
              </Typography>
              <List disablePadding>
                {dealDetail.activities.slice(0, 5).map((act) => (
                  <ListItem key={act.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={<Typography variant="caption">{act.content}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {act.user?.name} · {format(new Date(act.createdAt), 'MMM d, HH:mm')}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {isEdit && (
          <Button
            color="error"
            onClick={() => confirm('Delete this deal?') && deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.clientId}
        >
          {saveMutation.isPending ? <CircularProgress size={18} /> : isEdit ? 'Save' : 'Create Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
