import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  PeopleRounded,
  HandshakeRounded,
  TrendingUpRounded,
  WarningAmberRounded,
  AccessTimeRounded,
  CheckCircleRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api';
import { AppLayout } from '../../components/Layout/AppLayout';
import { StatusChip } from '../../components/Common/StatusChip';
import { format, isPast } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardMetrics } from '../../types';

const STAGE_ORDER = ['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED'] as const;
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'New Lead',
  NEGOTIATION: 'Negotiation',
  VIEWING: 'Viewing',
  CONTRACT: 'Contract',
  CLOSED: 'Closed',
};
const STAGE_COLORS = ['#6366F1', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

const SOURCE_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  subtitle?: string;
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, bg, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            bgcolor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState(30);
  const theme = useTheme();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardApi.getMetrics(period).then((r) => r.data),
    refetchInterval: 60000,
  });

  const stageData = metrics
    ? STAGE_ORDER.map((s, i) => ({
        name: STAGE_LABELS[s],
        count: metrics.dealsByStage[s] || 0,
        color: STAGE_COLORS[i],
      }))
    : [];

  const sourceData = metrics?.leadSources?.map((s, i) => ({
    name: s.source,
    count: s.count,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  })) || [];

  return (
    <AppLayout title="Dashboard">
      <Box>
        {/* Period filter */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, v) => v && setPeriod(v)}
            size="small"
          >
            <ToggleButton value={7}>7 days</ToggleButton>
            <ToggleButton value={30}>30 days</ToggleButton>
            <ToggleButton value={90}>90 days</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : metrics ? (
          <Grid container spacing={3}>
            {/* KPI Cards */}
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="New Leads"
                value={metrics.newLeads}
                icon={<PeopleRounded />}
                color="#6366F1"
                bg="#EEF2FF"
                subtitle={`Last ${period} days`}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Total Deals"
                value={metrics.totalDeals}
                icon={<HandshakeRounded />}
                color="#10B981"
                bg="#ECFDF5"
                subtitle={`${metrics.closedDeals} closed`}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Conversion Rate"
                value={`${metrics.conversionRate}%`}
                icon={<TrendingUpRounded />}
                color="#F59E0B"
                bg="#FFFBEB"
                subtitle="New Lead → Closed"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Overdue Tasks"
                value={metrics.overdueTasks}
                icon={<WarningAmberRounded />}
                color={metrics.overdueTasks > 0 ? '#EF4444' : '#10B981'}
                bg={metrics.overdueTasks > 0 ? '#FEF2F2' : '#ECFDF5'}
                subtitle="Requires attention"
              />
            </Grid>

            {/* Pipeline value card */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                    Active Pipeline Value
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    ₪{Number(metrics.pipelineValue).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across all open deals
                  </Typography>

                  {/* Deals by stage progress */}
                  <Box sx={{ mt: 2 }}>
                    {STAGE_ORDER.filter(s => s !== 'CLOSED').map((s, i) => (
                      <Box key={s} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {STAGE_LABELS[s]}
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {metrics.dealsByStage[s] || 0}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            metrics.totalDeals > 0
                              ? ((metrics.dealsByStage[s] || 0) / metrics.totalDeals) * 100
                              : 0
                          }
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: STAGE_COLORS[i],
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Lead Sources Chart */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                    Lead Sources
                  </Typography>
                  {sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sourceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        />
                        <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {sourceData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                      <Typography variant="body2" color="text.disabled">No data for this period</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Deals by stage bar */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                    Deals by Stage
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stageData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Tasks */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Upcoming Tasks
                    </Typography>
                    {metrics.overdueTasks > 0 && (
                      <Chip
                        label={`${metrics.overdueTasks} overdue`}
                        size="small"
                        sx={{ bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  {metrics.upcomingTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleRounded sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        All caught up!
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {metrics.upcomingTasks.map((task, i) => {
                        const overdue = isPast(new Date(task.dueAt)) && task.status !== 'DONE';
                        return (
                          <React.Fragment key={task.id}>
                            {i > 0 && <Divider />}
                            <ListItem disablePadding sx={{ py: 1 }}>
                              <ListItemAvatar>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: overdue ? 'error.light' : 'primary.light',
                                  }}
                                >
                                  <AccessTimeRounded sx={{ fontSize: 16 }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" fontWeight={500} noWrap>
                                    {task.title}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25 }}>
                                    <Typography
                                      variant="caption"
                                      color={overdue ? 'error.main' : 'text.secondary'}
                                      fontWeight={overdue ? 600 : 400}
                                    >
                                      {format(new Date(task.dueAt), 'MMM d, HH:mm')}
                                    </Typography>
                                    {task.client && (
                                      <Typography variant="caption" color="text.disabled">
                                        · {task.client.fullName}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                              <StatusChip value={task.priority} type="taskPriority" />
                            </ListItem>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}
      </Box>
    </AppLayout>
  );
};
