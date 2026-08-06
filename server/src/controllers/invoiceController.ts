import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/Invoice';
import Service from '../models/Service';

// @desc    Get all clinical invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice record not found.');
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new invoice, validate stock levels, decrement medicine inventory
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  const {
    invoiceNumber,
    patientName,
    patientId,
    patientAge,
    patientGender,
    visitDate,
    insuranceProvider,
    insurancePolicyNumber,
    insuranceCoveragePct,
    items,
    subtotal,
    discount,
    taxRate,
    tax,
    insuranceCoveredAmount,
    amountDue,
    status,
    paymentMethod
  } = req.body;

  try {
    // 1. Verify invoice number uniqueness
    const invoiceExists = await Invoice.findOne({ invoiceNumber: invoiceNumber.trim() });
    if (invoiceExists) {
      res.status(400);
      throw new Error(`Invoice number '${invoiceNumber}' already registered.`);
    }

    // 2. Validate medicine stock levels before executing transaction
    for (const item of items) {
      const service = await Service.findById(item.serviceId);
      if (!service) {
        res.status(400);
        throw new Error(`Clinical Service ID '${item.serviceId}' not found.`);
      }

      if (service.category === 'Pharmacy & Medicines' && typeof service.stock === 'number') {
        if (service.stock === 0) {
          res.status(400);
          throw new Error(`Out of Stock: Medicine '${service.name}' is out of stock!`);
        }
        if (item.quantity > service.stock) {
          res.status(400);
          throw new Error(`Insufficient Inventory: Only ${service.stock} units of '${service.name}' remain in stock.`);
        }
      }
    }

    // 3. Decrement stock for medicines
    for (const item of items) {
      const service = await Service.findById(item.serviceId);
      if (service && service.category === 'Pharmacy & Medicines' && typeof service.stock === 'number') {
        service.stock = Math.max(0, service.stock - item.quantity);
        await service.save();
      }
    }

    // 4. Create and save the clinical invoice
    const newInvoice = await Invoice.create({
      invoiceNumber,
      patientName,
      patientId,
      patientAge,
      patientGender,
      visitDate,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceCoveragePct,
      items,
      subtotal,
      discount,
      taxRate,
      tax,
      insuranceCoveredAmount,
      amountDue: status === 'paid' ? 0 : amountDue, // Enforce zero-balance for fully paid invoices
      status,
      paymentMethod
    });

    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice details
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice record not found.');
    }

    // Security check: Only owners can approve deletion requests
    const userRole = (req as any).user?.role;
    if (userRole !== 'owner' && req.body.deleteRequestStatus === 'approved') {
      res.status(403);
      throw new Error('Access Forbidden: Only clinical owners can approve deletion requests.');
    }

    // Update fields allowed to change
    Object.assign(invoice, req.body);
    
    // Ensure amountDue is zero if status is set to paid
    if (invoice.status === 'paid') {
      invoice.amountDue = 0;
    }

    const updatedInvoice = await invoice.save();
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice status (e.g. from payment completion)
// @route   PATCH /api/invoices/:id/status
// @access  Private
export const updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status, paymentMethod } = req.body;

  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice record not found.');
    }

    invoice.status = status;
    if (paymentMethod) {
      invoice.paymentMethod = paymentMethod;
    }

    // Reset amount due if status changes to paid
    if (status === 'paid') {
      invoice.amountDue = 0;
    }

    const updatedInvoice = await invoice.save();
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice record
// @route   DELETE /api/invoices/:id
// @access  Private/Owner
export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404);
      throw new Error('Invoice record not found.');
    }

    // Security check: Only owners can delete directly. Billing officers can delete only if approved by owner.
    const userRole = (req as any).user?.role;
    if (userRole !== 'owner') {
      if (invoice.deleteRequestStatus !== 'approved') {
        res.status(403);
        throw new Error('Access Forbidden: Billing officers can only delete invoices after owner approval.');
      }
    }

    // Return stock for pharmacy medicines when deleting the invoice
    for (const item of invoice.items) {
      const service = await Service.findById(item.serviceId);
      if (service && service.category === 'Pharmacy & Medicines' && typeof service.stock === 'number') {
        service.stock = service.stock + item.quantity;
        await service.save();
      }
    }

    await invoice.deleteOne();
    res.json({ success: true, message: 'Invoice record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
