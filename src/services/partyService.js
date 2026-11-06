import axiosInstance from '../api/axiosInstance';

export const partyService = {
  // Fetch parties / customers list with optional search, type filter, and pagination
  getParties: async ({ search = '', type = 'all', page, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (type && type !== 'all') params.append('type', type);

    const query = params.toString();
    const url = query ? `api/get-parties-list?${query}` : 'api/get-parties-list';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Customer auto-lookup by phone number
  customerLookup: async (phone) => {
    const clean = String(phone).replace(/\D/g, '');
    const response = await axiosInstance.get(`api/customer-lookup?phone=${clean}`);
    return response.data;
  },

  // Add new party / customer
  addParty: async (payload) => {
    const response = await axiosInstance.post('api/add-party', payload);
    return response.data;
  },

  // Update existing party
  updateParty: async (payload) => {
    const response = await axiosInstance.post('api/update-party', payload);
    return response.data;
  },

  // Delete party
  deleteParty: async (id) => {
    const response = await axiosInstance.post('api/delete-party', { id });
    return response.data;
  },
};

export default partyService;
