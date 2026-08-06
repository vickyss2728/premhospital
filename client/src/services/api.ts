const API_BASE = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const mapService = (srv: any) => ({
  id: srv._id,
  name: srv.name,
  code: srv.code,
  category: srv.category,
  price: srv.price,
  barcode: srv.barcode,
  stock: srv.stock
});

const mapInvoice = (inv: any) => ({
  id: inv._id,
  invoiceNumber: inv.invoiceNumber,
  patientName: inv.patientName,
  patientId: inv.patientId,
  patientAge: inv.patientAge,
  patientGender: inv.patientGender,
  visitDate: inv.visitDate,
  insuranceProvider: inv.insuranceProvider,
  insurancePolicyNumber: inv.insurancePolicyNumber,
  insuranceCoveragePct: inv.insuranceCoveragePct,
  items: inv.items.map((item: any) => ({
    id: item._id || item.serviceId,
    serviceId: item.serviceId,
    name: item.name,
    category: item.category || 'Pharmacy & Medicines',
    price: item.price,
    quantity: item.quantity,
    amount: item.total // Map DB total to UI amount
  })),
  subtotal: inv.subtotal,
  discount: inv.discount,
  taxRate: inv.taxRate,
  tax: inv.tax,
  insuranceCoveredAmount: inv.insuranceCoveredAmount,
  amountDue: inv.amountDue,
  status: inv.status,
  paymentMethod: inv.paymentMethod,
  createdAt: inv.createdAt,
  deleteRequestStatus: inv.deleteRequestStatus || 'none'
});

export const api = {
  // Auth
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Services
  async getServices() {
    const res = await fetch(`${API_BASE}/services`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch services');
    const json = await res.json();
    const list = json.data || [];
    return list.map(mapService);
  },

  async createService(service: any) {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(service)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create service');
    }
    const srv = await res.json();
    return mapService(srv.data);
  },

  async updateService(id: string, service: any) {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(service)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update service');
    }
    const srv = await res.json();
    return mapService(srv.data);
  },

  // Invoices
  async getInvoices() {
    const res = await fetch(`${API_BASE}/invoices`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch invoices');
    const json = await res.json();
    const list = json.data || [];
    return list.map(mapInvoice);
  },

  async createInvoice(invoice: any) {
    const formattedItems = invoice.items.map((item: any) => ({
      serviceId: item.serviceId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.amount // Map UI amount to DB total
    }));

    const body = {
      invoiceNumber: invoice.invoiceNumber,
      patientName: invoice.patientName,
      patientId: invoice.patientId,
      patientAge: invoice.patientAge,
      patientGender: invoice.patientGender,
      visitDate: invoice.visitDate,
      insuranceProvider: invoice.insuranceProvider,
      insurancePolicyNumber: invoice.insurancePolicyNumber,
      insuranceCoveragePct: invoice.insuranceCoveragePct,
      items: formattedItems,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      taxRate: invoice.taxRate,
      tax: invoice.tax,
      insuranceCoveredAmount: invoice.insuranceCoveredAmount,
      amountDue: invoice.amountDue,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      deleteRequestStatus: invoice.deleteRequestStatus || 'none'
    };

    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create invoice');
    }
    const inv = await res.json();
    return mapInvoice(inv.data);
  },

  async updateInvoice(id: string, invoice: any) {
    const formattedItems = invoice.items.map((item: any) => ({
      serviceId: item.serviceId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.amount // Map UI amount to DB total
    }));

    const body = {
      invoiceNumber: invoice.invoiceNumber,
      patientName: invoice.patientName,
      patientId: invoice.patientId,
      patientAge: invoice.patientAge,
      patientGender: invoice.patientGender,
      visitDate: invoice.visitDate,
      insuranceProvider: invoice.insuranceProvider,
      insurancePolicyNumber: invoice.insurancePolicyNumber,
      insuranceCoveragePct: invoice.insuranceCoveragePct,
      items: formattedItems,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      taxRate: invoice.taxRate,
      tax: invoice.tax,
      insuranceCoveredAmount: invoice.insuranceCoveredAmount,
      amountDue: invoice.amountDue,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      deleteRequestStatus: invoice.deleteRequestStatus || 'none'
    };

    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update invoice');
    }
    const inv = await res.json();
    return mapInvoice(inv.data);
  },

  async updateInvoiceStatus(id: string, status: string, amountDue: number) {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, amountDue })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update invoice status');
    }
    const inv = await res.json();
    return mapInvoice(inv.data);
  },

  async deleteInvoice(id: string) {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete invoice');
    return res.json();
  }
};
