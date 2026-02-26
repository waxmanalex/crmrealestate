import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Stack,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Chip,
} from '@mui/material';
import { CloseRounded, DeleteRounded, UploadRounded } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../../api';
import { Property } from '../../types';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

interface PropertyDrawerProps {
  open: boolean;
  onClose: () => void;
  property: Property | null;
  onSaved: () => void;
}

const STATUSES = ['ACTIVE', 'UNDER_OFFER', 'RENTED', 'SOLD', 'ARCHIVED'];
const CURRENCIES = ['ILS', 'USD'];

export const PropertyDrawer: React.FC<PropertyDrawerProps> = ({ open, onClose, property, onSaved }) => {
  const [form, setForm] = useState<Partial<Property & { ownerClientId?: string }>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const isEdit = !!property;

  useEffect(() => {
    if (property) {
      setForm({
        title: property.title,
        address: property.address,
        price: property.price,
        currency: property.currency || 'ILS',
        description: property.description || '',
        status: property.status || 'ACTIVE',
        rooms: property.rooms,
        sizeSqm: property.sizeSqm,
        floor: property.floor,
        ownerClientId: property.ownerClientId,
      });
    } else {
      setForm({ currency: 'ILS', status: 'ACTIVE' });
    }
    setPhotos([]);
  }, [property, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        price: Number(form.price),
        rooms: form.rooms ? Number(form.rooms) : undefined,
        sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
        floor: form.floor !== undefined ? Number(form.floor) : undefined,
      };
      if (isEdit) {
        const { data } = await propertiesApi.update(property!.id, payload);
        if (photos.length > 0) await propertiesApi.uploadPhotos(property!.id, photos);
        return data;
      } else {
        const { data } = await propertiesApi.create(payload);
        if (photos.length > 0) await propertiesApi.uploadPhotos(data.id, photos);
        return data;
      }
    },
    onSuccess: () => {
      onSaved();
      enqueueSnackbar(isEdit ? 'Property updated' : 'Property created', { variant: 'success' });
      onClose();
    },
    onError: () => enqueueSnackbar('Failed to save property', { variant: 'error' }),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => propertiesApi.deletePhoto(property!.id, photoId),
    onSuccess: () => {
      onSaved();
      enqueueSnackbar('Photo deleted', { variant: 'success' });
    },
  });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? 'Edit Property' : 'New Property'}
          </Typography>
          <IconButton onClick={onClose}><CloseRounded /></IconButton>
        </Box>

        {/* Form */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Title *"
              value={form.title || ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Address *"
              value={form.address || ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              fullWidth
              size="small"
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Price *"
                type="number"
                value={form.price || ''}
                onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) }))}
                sx={{ flex: 2 }}
                size="small"
              />
              <TextField
                select
                label="Currency"
                value={form.currency || 'ILS'}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as any }))}
                sx={{ flex: 1 }}
                size="small"
              >
                {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Box>
            <TextField
              select
              label="Status"
              value={form.status || 'ACTIVE'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              fullWidth
              size="small"
            >
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Rooms"
                type="number"
                value={form.rooms || ''}
                onChange={(e) => setForm((f) => ({ ...f, rooms: parseInt(e.target.value) }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Size (m²)"
                type="number"
                value={form.sizeSqm || ''}
                onChange={(e) => setForm((f) => ({ ...f, sizeSqm: parseInt(e.target.value) }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Floor"
                type="number"
                value={form.floor ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, floor: parseInt(e.target.value) }))}
                fullWidth
                size="small"
              />
            </Box>
            <TextField
              label="Description"
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              size="small"
            />

            {/* Existing photos */}
            {isEdit && property?.photos && property.photos.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1, display: 'block' }}>
                  Photos
                </Typography>
                <ImageList cols={3} rowHeight={100} gap={8}>
                  {property.photos.map((photo) => (
                    <ImageListItem key={photo.id} sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
                      <img src={photo.url} alt="" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      <ImageListItemBar
                        sx={{ background: 'rgba(0,0,0,0.4)' }}
                        actionIcon={
                          <IconButton
                            size="small"
                            sx={{ color: '#fff' }}
                            onClick={() => deletePhotoMutation.mutate(photo.id)}
                          >
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}

            {/* Upload new photos */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1, display: 'block' }}>
                {isEdit ? 'Add More Photos' : 'Photos'}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadRounded />}
                size="small"
              >
                Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                />
              </Button>
              {photos.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {photos.map((f, i) => (
                    <Chip key={i} label={f.name} size="small" onDelete={() => setPhotos((p) => p.filter((_, j) => j !== i))} />
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.title || !form.address || !form.price}
          >
            {saveMutation.isPending ? <CircularProgress size={18} /> : isEdit ? 'Save Changes' : 'Create Property'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
