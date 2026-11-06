import axiosInstance from '../api/axiosInstance';

export const salesService = {
  // Fetch sales records with optional search, date filters, and pagination
  getSales: async ({ search = '', date_from = '', date_to = '', page = 1 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    if (page) params.append('page', page);

    const response = await axiosInstance.get(`api/get-sales-list?${params.toString()}`);
    return response.data;
  },

  // Fetch single sale detail with all line items
  getSaleDetail: async (saleId) => {
    const response = await axiosInstance.get(`api/get-sale-detail?sale_id=${saleId}`);
    return response.data;
  },

  // Create new sale with multiple items and auto-generate invoice
  createSale: async (payload) => {
    const response = await axiosInstance.post('api/add-sale', payload);
    return response.data;
  },

  // Update existing sale
  updateSale: async (payload) => {
    const response = await axiosInstance.post('api/update-sale', payload);
    return response.data;
  },

  // Delete sale by id
  deleteSale: async (saleId) => {
    const response = await axiosInstance.post('api/delete-sale', { id: saleId, sale_id: saleId });
    return response.data;
  },
};

export default salesService;
