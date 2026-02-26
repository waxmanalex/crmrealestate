import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Deal, DealStage } from '../../types';
import { DealCard } from './DealCard';

interface KanbanColumnProps {
  stage: DealStage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

const stageConfig: Record<DealStage, { label: string; color: string; bg: string }> = {
  NEW_LEAD: { label: 'New Lead', color: '#6366F1', bg: '#EEF2FF' },
  NEGOTIATION: { label: 'Negotiation', color: '#F59E0B', bg: '#FFFBEB' },
  VIEWING: { label: 'Viewing', color: '#3B82F6', bg: '#EFF6FF' },
  CONTRACT: { label: 'Contract', color: '#8B5CF6', bg: '#F5F3FF' },
  CLOSED: { label: 'Closed', color: '#10B981', bg: '#ECFDF5' },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, deals, onDealClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const config = stageConfig[stage];

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 300,
        flex: '0 0 280px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          px: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: config.color,
            }}
          />
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {config.label}
          </Typography>
          <Chip
            label={deals.length}
            size="small"
            sx={{
              height: 20,
              bgcolor: config.bg,
              color: config.color,
              fontWeight: 700,
              fontSize: '0.7rem',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Box>
        {totalValue > 0 && (
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {totalValue.toLocaleString()}
          </Typography>
        )}
      </Box>

      {/* Column body */}
      <Paper
        ref={setNodeRef}
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 200,
          p: 1,
          bgcolor: isOver ? 'primary.light' : 'action.hover',
          borderRadius: 3,
          border: '2px dashed',
          borderColor: isOver ? 'primary.main' : 'transparent',
          transition: 'all 0.15s ease',
          opacity: isOver ? 0.9 : 1,
        }}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 80,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              Drop deals here
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
