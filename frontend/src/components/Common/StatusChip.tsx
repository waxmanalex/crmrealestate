import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { ClientStatus, DealStage, TaskPriority, TaskStatus, PropertyStatus } from '../../types';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  value: string;
  type: 'clientStatus' | 'dealStage' | 'taskPriority' | 'taskStatus' | 'propertyStatus';
}

const configs: Record<string, Record<string, { label: string; color: string; bg: string }>> = {
  clientStatus: {
    NEW: { label: 'New', color: '#6366F1', bg: '#EEF2FF' },
    ACTIVE: { label: 'Active', color: '#10B981', bg: '#ECFDF5' },
    NOT_INTERESTED: { label: 'Not Interested', color: '#6B7280', bg: '#F3F4F6' },
    CONVERTED: { label: 'Converted', color: '#8B5CF6', bg: '#F5F3FF' },
    LOST: { label: 'Lost', color: '#EF4444', bg: '#FEF2F2' },
  },
  dealStage: {
    NEW_LEAD: { label: 'New Lead', color: '#6366F1', bg: '#EEF2FF' },
    NEGOTIATION: { label: 'Negotiation', color: '#F59E0B', bg: '#FFFBEB' },
    VIEWING: { label: 'Viewing', color: '#3B82F6', bg: '#EFF6FF' },
    CONTRACT: { label: 'Contract', color: '#8B5CF6', bg: '#F5F3FF' },
    CLOSED: { label: 'Closed', color: '#10B981', bg: '#ECFDF5' },
  },
  taskPriority: {
    LOW: { label: 'Low', color: '#10B981', bg: '#ECFDF5' },
    MEDIUM: { label: 'Medium', color: '#F59E0B', bg: '#FFFBEB' },
    HIGH: { label: 'High', color: '#EF4444', bg: '#FEF2F2' },
  },
  taskStatus: {
    TODO: { label: 'To Do', color: '#6B7280', bg: '#F3F4F6' },
    IN_PROGRESS: { label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF' },
    DONE: { label: 'Done', color: '#10B981', bg: '#ECFDF5' },
  },
  propertyStatus: {
    ACTIVE: { label: 'Active', color: '#10B981', bg: '#ECFDF5' },
    UNDER_OFFER: { label: 'Under Offer', color: '#F59E0B', bg: '#FFFBEB' },
    RENTED: { label: 'Rented', color: '#3B82F6', bg: '#EFF6FF' },
    SOLD: { label: 'Sold', color: '#8B5CF6', bg: '#F5F3FF' },
    ARCHIVED: { label: 'Archived', color: '#6B7280', bg: '#F3F4F6' },
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({ value, type, ...props }) => {
  const config = configs[type]?.[value];
  if (!config) return <Chip label={value} size="small" {...props} />;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        color: config.color,
        bgcolor: config.bg,
        fontWeight: 600,
        fontSize: '0.72rem',
        height: 22,
        '& .MuiChip-label': { px: 1 },
      }}
      {...props}
    />
  );
};
