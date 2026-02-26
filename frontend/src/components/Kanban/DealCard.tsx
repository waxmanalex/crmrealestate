import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Chip, Tooltip } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PersonRounded,
  HomeWorkRounded,
  AttachMoneyRounded,
  AccessTimeRounded,
} from '@mui/icons-material';
import { Deal } from '../../types';
import { format, isPast } from 'date-fns';

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue =
    deal.nextActionAt && isPast(new Date(deal.nextActionAt));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(deal)}
      sx={{
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        boxShadow: isDragging
          ? '0 8px 24px rgba(99,102,241,0.2)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.15s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderColor: 'primary.light',
        },
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        {/* Client */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.7rem' }}>
            {deal.client.fullName.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
            {deal.client.fullName}
          </Typography>
        </Box>

        {/* Property */}
        {deal.property && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <HomeWorkRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {deal.property.title}
            </Typography>
          </Box>
        )}

        {/* Value */}
        {deal.value && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <AttachMoneyRounded sx={{ fontSize: 13, color: 'success.main' }} />
            <Typography variant="caption" fontWeight={600} color="success.main">
              {Number(deal.value).toLocaleString()} {deal.property?.currency || 'ILS'}
            </Typography>
            {deal.probability !== undefined && (
              <Typography variant="caption" color="text.secondary">
                · {deal.probability}%
              </Typography>
            )}
          </Box>
        )}

        {/* Next action */}
        {deal.nextActionAt && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 1,
              p: 0.75,
              borderRadius: 1.5,
              bgcolor: isOverdue ? 'error.light' : 'action.hover',
            }}
          >
            <AccessTimeRounded
              sx={{ fontSize: 12, color: isOverdue ? 'error.dark' : 'text.secondary' }}
            />
            <Typography
              variant="caption"
              color={isOverdue ? 'error.dark' : 'text.secondary'}
              fontWeight={isOverdue ? 600 : 400}
            >
              {format(new Date(deal.nextActionAt), 'MMM d, HH:mm')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
