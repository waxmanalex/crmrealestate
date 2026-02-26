import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi } from '../../api';
import { AppLayout } from '../../components/Layout/AppLayout';
import { PageHeader } from '../../components/Common/PageHeader';
import { KanbanColumn } from '../../components/Kanban/KanbanColumn';
import { DealCard } from '../../components/Kanban/DealCard';
import { DealModal } from './DealModal';
import { Deal, DealStage } from '../../types';
import { useSnackbar } from 'notistack';

const STAGES: DealStage[] = ['NEW_LEAD', 'NEGOTIATION', 'VIEWING', 'CONTRACT', 'CLOSED'];

export const Deals: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [optimisticData, setOptimisticData] = useState<Record<DealStage, Deal[]> | null>(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: kanbanData, isLoading, error } = useQuery({
    queryKey: ['deals', 'kanban'],
    queryFn: () => dealsApi.getKanban().then((r) => r.data),
    staleTime: 30000,
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      dealsApi.updateStage(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setOptimisticData(null);
      enqueueSnackbar('Deal stage updated', { variant: 'success' });
    },
    onError: () => {
      setOptimisticData(null);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      enqueueSnackbar('Failed to update deal stage', { variant: 'error' });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const displayData = optimisticData || kanbanData;

  const handleDragStart = (event: DragStartEvent) => {
    const dealId = event.active.id as string;
    if (!displayData) return;
    for (const stage of STAGES) {
      const deal = displayData[stage]?.find((d) => d.id === dealId);
      if (deal) { setActiveDeal(deal); return; }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over || !displayData) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Determine source stage
    let sourceStage: DealStage | null = null;
    for (const stage of STAGES) {
      if (displayData[stage]?.find((d) => d.id === dealId)) {
        sourceStage = stage;
        break;
      }
    }

    // Determine target stage (over a column or over a card)
    let targetStage: DealStage | null = null;
    if (STAGES.includes(overId as DealStage)) {
      targetStage = overId as DealStage;
    } else {
      for (const stage of STAGES) {
        if (displayData[stage]?.find((d) => d.id === overId)) {
          targetStage = stage;
          break;
        }
      }
    }

    if (!sourceStage || !targetStage || sourceStage === targetStage) return;

    // Optimistic update
    const newData = { ...displayData };
    STAGES.forEach((s) => { newData[s] = [...(newData[s] || [])]; });
    const deal = newData[sourceStage].find((d) => d.id === dealId)!;
    newData[sourceStage] = newData[sourceStage].filter((d) => d.id !== dealId);
    newData[targetStage] = [...newData[targetStage], { ...deal, stage: targetStage }];
    setOptimisticData(newData);

    stageMutation.mutate({ id: dealId, stage: targetStage });
  };

  const handleDealClick = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  }, []);

  const handleNewDeal = () => {
    setSelectedDeal(null);
    setModalOpen(true);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Deals Pipeline"
        subtitle={displayData ? `${STAGES.reduce((s, k) => s + (displayData[k]?.length || 0), 0)} total deals` : undefined}
        action={{ label: 'New Deal', onClick: handleNewDeal }}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load deals</Alert>
      ) : displayData ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 2,
              minHeight: 'calc(100vh - 200px)',
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-track': { bgcolor: 'action.hover', borderRadius: 3 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
            }}
          >
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={displayData[stage] || []}
                onDealClick={handleDealClick}
              />
            ))}
          </Box>

          <DragOverlay>
            {activeDeal ? (
              <Box sx={{ transform: 'rotate(2deg)' }}>
                <DealCard deal={activeDeal} onClick={() => {}} />
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <DealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        deal={selectedDeal}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['deals'] })}
      />
    </AppLayout>
  );
};
