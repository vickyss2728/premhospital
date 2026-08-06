import { Request, Response, NextFunction } from 'express';
import Service from '../models/Service';

// @desc    Get all clinical services & pharmacy inventory
// @route   GET /api/services
// @access  Private
export const getServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await Service.find({});
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new clinical service or medicine entry
// @route   POST /api/services
// @access  Private/Owner
export const createService = async (req: Request, res: Response, next: NextFunction) => {
  const { name, code, category, price, barcode, stock } = req.body;

  try {
    const serviceExists = await Service.findOne({ code: code.trim() });
    if (serviceExists) {
      res.status(400);
      throw new Error(`Service code '${code}' already registered.`);
    }

    const service = await Service.create({
      name,
      code,
      category,
      price,
      barcode,
      stock: category === 'Pharmacy & Medicines' ? (stock !== undefined ? Number(stock) : 0) : undefined
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service details or adjust medicine inventory stock
// @route   PUT /api/services/:id
// @access  Private
export const updateService = async (req: Request, res: Response, next: NextFunction) => {
  const { name, code, category, price, barcode, stock } = req.body;

  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404);
      throw new Error('Clinical service resource not found.');
    }

    service.name = name || service.name;
    service.code = code || service.code;
    service.category = category || service.category;
    if (price !== undefined) service.price = Number(price);
    if (barcode !== undefined) service.barcode = barcode;
    
    // Set stock only if category matches pharmacy
    if (service.category === 'Pharmacy & Medicines' && stock !== undefined) {
      service.stock = Number(stock);
    } else if (service.category !== 'Pharmacy & Medicines') {
      service.stock = undefined;
    }

    const updatedService = await service.save();
    res.json({ success: true, data: updatedService });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a clinical service
// @route   DELETE /api/services/:id
// @access  Private/Owner
export const deleteService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      res.status(404);
      throw new Error('Clinical service resource not found.');
    }

    await service.deleteOne();
    res.json({ success: true, message: 'Clinical service deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
