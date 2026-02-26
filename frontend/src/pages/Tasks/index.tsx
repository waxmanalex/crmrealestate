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
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Skeleton,
  TablePagination,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  SearchRounded,
  EditRounded,
  DeleteRounded,
  CheckCircleRounded,
  AccessTimeRounded,
  WarningAmberRounded,
  CloseRounded,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, clientsApi, dealsApi } from '../../api';
import { AppLayout } from '../../components/Layout/AppLayout';
import { PageHeader } from '../../components/Common/PageHeader';
import { StatusChip } from '../../components/Common/StatusChip';
import { Task } from '../../types';
import { useSnackbar } from 'notistack';
import { format, isPast } from 'date-fns';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onSaved: () => void;
}

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({ open, onClose, task, onSaved }) => {
  const [form, setForm] = useState<Partial<Task>>({});
  const [clientSearch, setClientSearch] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!task;

  React.useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        dueAt: task.dueAt,
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        assignedTo: task.assignedTo,
        relatedClientId: task.relatedClientId,
        relatedDealId: task.relatedDealId,
        reminderAt: task.reminderAt,
      });
    } else {
      setForm({ priority: 'MEDIUM', status: 'TODO' });
    }
  }, [task, open]);

  const { data: clientsData } = useQuery({
    queryKey: ['clients-search-task', clientSearch],
    queryFn: () => clientsApi.getAll({ search: clientSearch, limit: 20 }).then((r) => r.data.data),
    staleTime: 10000,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        dueAt: form.dueAt || new Date().toISOString(),
      };
      return isEdit ? tasksApi.update(task!.id, payload) : tasksApi.create(payload);
    },
    onSuccess: () => {
      onSaved();
      enqueueSnackbar(isEdit ? 'Task updated' : 'Task created', { variant: 'success' });
      onClose();
    },
    onError: () => enqueueSnackbar('Failed to save task', { variant: 'error' }),
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>{isEdit ? 'Edit Task' : 'New Task'}</Typography>
        <IconButton onClick={onClose} size="small"><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Title *"
            value={form.title || ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="Description"
            value={form.description || ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Due Date *"
              type="datetime-local"
              value={form.dueAt ? form.dueAt.slice(0, 16) : ''}
              onChange={(e) => setForm((f) => ({ ...f, dueAt: new Date(e.target.value).toISOString() }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Reminder"
              type="datetime-local"
              value={form.reminderAt ? form.reminderAt.slice(0, 16) : ''}
              onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              select
              label="Priority"
              value={form.priority || 'MEDIUM'}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as any }))}
              fullWidth
              size="small"
            >
              {TASK_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Status"
              value={form.status || 'TODO'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              fullWidth
              size="small"
            >
              {TASK_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
          <Autocomplete
            options={clientsData || []}
            getOptionLabel={(c) => c.fullName}
            value={clientsData?.find((c) => c.id === form.relatedClientId) || null}
            onInputChange={(_, v) => setClientSearch(v)}
            onChange={(_, c) => setForm((f) => ({ ...f, relatedClientId: c?.id }))}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => <TextField {...params} label="Related Client" size="small" />}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.title || !form.dueAt}
        >
          {saveMutation.isPending ? <CircularProgress size={18} /> : isEdit ? 'Save' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const Tasks: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dueFilter, setDueFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { status: statusFilter, priority: priorityFilter, due: dueFilter, page: page + 1, limit: rowsPerPage }],
    queryFn: () =>
      tasksApi.getAll({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        due: (dueFilter as any) || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }).then((r) => r.data),
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      enqueueSnackbar('Task deleted', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to delete', { variant: 'error' }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.update(id, { status: 'DONE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      enqueueSnackbar('Task completed!', { variant: 'success' });
    },
  });

  const handleOpen = (task?: Task) => {
    setSelectedTask(task || null);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Tasks"
        subtitle={data ? `${data.total} total` : undefined}
        action={{ label: 'New Task', onClick: () => handleOpen() }}
      >
        <TextField
          select
          size="small"
          value={dueFilter}
          onChange={(e) => { setDueFilter(e.target.value); setPage(0); }}
          sx={{ width: 130 }}
          label="Due"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="overdue">Overdue</MenuItem>
          <MenuItem value="upcoming">Upcoming</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ width: 130 }}
          label="Status"
        >
          <MenuItem value="">All</MenuItem>
          {TASK_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField
          select
          size="small"
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
          sx={{ width: 120 }}
          label="Priority"
        >
          <MenuItem value="">All</MenuItem>
          {TASK_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
      </PageHeader>

      <Card>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Related To</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.data.map((task) => {
                    const overdue = task.status !== 'DONE' && isPast(new Date(task.dueAt));
                    return (
                      <TableRow
                        key={task.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          bgcolor: overdue ? 'rgba(239,68,68,0.03)' : 'transparent',
                        }}
                        onClick={() => handleOpen(task)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {overdue && <WarningAmberRounded sx={{ fontSize: 16, color: 'error.main' }} />}
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ textDecoration: task.status === 'DONE' ? 'line-through' : 'none', color: task.status === 'DONE' ? 'text.secondary' : 'text.primary' }}
                              >
                                {task.title}
                              </Typography>
                              {task.description && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                                  {task.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeRounded sx={{ fontSize: 13, color: overdue ? 'error.main' : 'text.secondary' }} />
                            <Typography
                              variant="caption"
                              color={overdue ? 'error.main' : 'text.secondary'}
                              fontWeight={overdue ? 600 : 400}
                            >
                              {format(new Date(task.dueAt), 'MMM d, yyyy HH:mm')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip value={task.priority} type="taskPriority" />
                        </TableCell>
                        <TableCell>
                          <StatusChip value={task.status} type="taskStatus" />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {task.client && (
                              <Typography variant="caption" display="block">
                                👤 {task.client.fullName}
                              </Typography>
                            )}
                            {task.deal && (
                              <StatusChip value={task.deal.stage} type="dealStage" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {task.agent?.name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {task.status !== 'DONE' && (
                              <Tooltip title="Mark Done">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={(e) => { e.stopPropagation(); completeMutation.mutate(task.id); }}
                                >
                                  <CheckCircleRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handleOpen(task); }}
                              >
                                <EditRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteMutation.mutate(task.id); }}
                              >
                                <DeleteRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      <TaskFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={selectedTask}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </AppLayout>
  );
};
