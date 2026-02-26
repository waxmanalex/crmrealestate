import { Response, NextFunction } from 'express';
import path from 'path';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { createPropertySchema, updatePropertySchema } from '../schemas';
import { Prisma } from '@prisma/client';

export const getProperties = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      status,
      currency,
      minPrice,
      maxPrice,
      minRooms,
      maxRooms,
      minSize,
      maxSize,
      page = '1',
      limit = '20',
    } = req.query;

    const where: Prisma.PropertyWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status as any;
    if (currency) where.currency = currency as any;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as any).gte = parseFloat(minPrice as string);
      if (maxPrice) (where.price as any).lte = parseFloat(maxPrice as string);
    }

    if (minRooms || maxRooms) {
      where.rooms = {};
      if (minRooms) (where.rooms as any).gte = parseInt(minRooms as string);
      if (maxRooms) (where.rooms as any).lte = parseInt(maxRooms as string);
    }

    if (minSize || maxSize) {
      where.sizeSqm = {};
      if (minSize) (where.sizeSqm as any).gte = parseInt(minSize as string);
      if (maxSize) (where.sizeSqm as any).lte = parseInt(maxSize as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          photos: true,
          owner: { select: { id: true, fullName: true, phone: true } },
          _count: { select: { deals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.property.count({ where }),
    ]);

    res.json({
      data: properties,
      total,
      page: parseInt(page as string),
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
};

export const getProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        photos: true,
        owner: { select: { id: true, fullName: true, phone: true, email: true } },
        deals: {
          include: {
            client: { select: { id: true, fullName: true, phone: true } },
            agent: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          where: { status: { not: 'DONE' } },
          orderBy: { dueAt: 'asc' },
        },
      },
    });

    if (!property) throw new AppError('Property not found', 404);
    res.json(property);
  } catch (err) {
    next(err);
  }
};

export const createProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPropertySchema.parse(req.body);

    const property = await prisma.property.create({
      data: {
        ...data,
        price: data.price,
      },
      include: {
        photos: true,
        owner: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
};

export const updateProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updatePropertySchema.parse(req.body);

    const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Property not found', 404);

    const property = await prisma.property.update({
      where: { id: req.params.id },
      data,
      include: {
        photos: true,
        owner: { select: { id: true, fullName: true } },
      },
    });

    res.json(property);
  } catch (err) {
    next(err);
  }
};

export const deleteProperty = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN') {
      throw new AppError('Only admins can delete properties', 403);
    }

    const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Property not found', 404);

    await prisma.property.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const uploadPhotos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Property not found', 404);

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const photos = await Promise.all(
      files.map((file) =>
        prisma.propertyPhoto.create({
          data: {
            propertyId: req.params.id,
            url: `/uploads/${file.filename}`,
          },
        })
      )
    );

    res.status(201).json(photos);
  } catch (err) {
    next(err);
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const photo = await prisma.propertyPhoto.findUnique({ where: { id: req.params.photoId } });
    if (!photo) throw new AppError('Photo not found', 404);

    await prisma.propertyPhoto.delete({ where: { id: req.params.photoId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
