import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Stack,
} from '@mui/material';
import {
  CloseRounded,
  PersonRounded,
  PhoneRounded,
  EmailRounded,
  NoteAddRounded,
  PhoneCallbackRounded,
  MeetingRoomRounded,
  MailRounded,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api';
import { Client, Activity, ActivityType } from '../../types';
import { useSnackbar } from 'notistack';
import { StatusChip } from '../../components/Common/StatusChip';
import { format } from 'date-fns';

interface ClientDrawerProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSaved: () => void;
}

const activityIcons: Record<string, React.ReactNode> = {
  NOTE: <NoteAddRounded fontSize="small" />,
  CALL: <PhoneCallbackRounded fontSize="small" />,
  MEETING: <MeetingRoomRounded fontSize="small" />,
  EMAIL: <MailRounded fontSize="small" />,
  STAGE_CHANGE: <PersonRounded fontSize="small" />,
  DEAL_CREATED: <PersonRounded fontSize="small" />,
  TASK_CREATED: <PersonRounded fontSize="small" />,
  STATUS_CHANGE: <PersonRounded fontSize="small" />,
};

const LEAD_SOURCES = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'REFERRAL', 'PORTAL', 'OTHER'];
const CLIENT_STATUSES = ['NEW', 'ACTIVE', 'NOT_INTERESTED', 'CONVERTED', 'LOST'];

export const ClientDrawer: React.FC<ClientDrawerProps> = ({ open, onClose, client, onSaved }) => {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Partial<Client>>({});
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<ActivityType>('NOTE');
  const [tagInput, setTagInput] = useState('');

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!client;

  useEffect(() => {
    if (client) {
      setForm({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email || '',
        leadSource: client.leadSource,
        status: client.status,
        assignedTo: client.assignedTo,
        tags: client.tags || [],
        notes: client.notes || '',
      });
    } else {
      setForm({ status: 'NEW', tags: [] });
    }
    setTab(0);
  }, [client, open]);

  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['client-activities', client?.id],
    queryFn: () => clientsApi.getActivities(client!.id).then((r) => r.data),
    enabled: !!client && tab === 2,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      isEdit
        ? clientsApi.update(client!.id, form)
        : clientsApi.create(form),
    onSuccess: () => {
      onSaved();
      enqueueSnackbar(isEdit ? 'Client updated' : 'Client created', { variant: 'success' });
      if (!isEdit) onClose();
    },
    onError: () => enqueueSnackbar('Failed to save client', { variant: 'error' }),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => clientsApi.addActivity(client!.id, { type: noteType, content: noteText }),
    onSuccess: () => {
      setNoteText('');
      refetchActivities();
      enqueueSnackbar('Activity added', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to add activity', { variant: 'error' }),
  });

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags?.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...(f.tags || []), tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags?.filter((t) => t !== tag) }));
  };

  const field = (key: keyof Client, label: string, props?: any) => (
    <TextField
      label={label}
      value={(form as any)[key] || ''}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      fullWidth
      size="small"
      {...props}
    />
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {client && (
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                {client.fullName.charAt(0)}
              </Avatar>
            )}
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {isEdit ? client?.fullName : 'New Client'}
              </Typography>
              {isEdit && <StatusChip value={client!.status} type="clientStatus" />}
            </Box>
          </Box>
          <IconButton onClick={onClose}><CloseRounded /></IconButton>
        </Box>

        {/* Tabs */}
        {isEdit && (
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
            <Tab label="Info" />
            <Tab label={`Deals (${client?._count?.deals || 0})`} />
            <Tab label="Activity" />
          </Tabs>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Info Tab */}
          {tab === 0 && (
            <Stack spacing={2}>
              {field('fullName', 'Full Name *')}
              {field('phone', 'Phone *')}
              {field('email', 'Email')}
              <TextField
                select
                label="Lead Source"
                value={form.leadSource || ''}
                onChange={(e) => setForm((f) => ({ ...f, leadSource: e.target.value as any }))}
                fullWidth
                size="small"
              >
                <MenuItem value="">None</MenuItem>
                {LEAD_SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField
                select
                label="Status"
                value={form.status || 'NEW'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                fullWidth
                size="small"
              >
                {CLIENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              {/* Tags */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1, display: 'block' }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                  {form.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => removeTag(tag)}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" size="small" onClick={addTag}>Add</Button>
                </Box>
              </Box>
              <TextField
                label="Notes"
                value={form.notes || ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Stack>
          )}

          {/* Deals Tab */}
          {tab === 1 && (
            <Box>
              {client?.deals?.length === 0 ? (
                <Typography color="text.secondary" variant="body2">No deals yet</Typography>
              ) : (
                client?.deals?.map((deal) => (
                  <Box
                    key={deal.id}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusChip value={deal.stage} type="dealStage" />
                      {deal.value && (
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {Number(deal.value).toLocaleString()} {deal.property?.currency}
                        </Typography>
                      )}
                    </Box>
                    {deal.property && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {deal.property.title}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}

          {/* Activity Tab */}
          {tab === 2 && (
            <Box>
              {/* Add activity */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <TextField
                  select
                  label="Type"
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as ActivityType)}
                  size="small"
                  sx={{ mb: 1.5, width: 140 }}
                >
                  <MenuItem value="NOTE">Note</MenuItem>
                  <MenuItem value="CALL">Call</MenuItem>
                  <MenuItem value="MEETING">Meeting</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Write a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                >
                  Add
                </Button>
              </Box>

              {/* Activity list */}
              <List disablePadding>
                {activities?.map((act: Activity, i: number) => (
                  <React.Fragment key={act.id}>
                    {i > 0 && <Divider />}
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.7rem' }}>
                          {activityIcons[act.type]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500}>
                            {act.content}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.25 }}>
                            <Typography variant="caption" color="text.secondary">
                              {act.user?.name} · {format(new Date(act.createdAt), 'MMM d, HH:mm')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </Box>

        {/* Footer */}
        {tab === 0 && (
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1.5,
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.fullName || !form.phone}
            >
              {saveMutation.isPending ? <CircularProgress size={18} /> : isEdit ? 'Save Changes' : 'Create Client'}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
