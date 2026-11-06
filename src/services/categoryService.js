import axiosInstance from '../api/axiosInstance';

export const categoryService = {
  // Get categories (supports optional pagination, search)
  getCategories: async ({ page, limit = 8, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const query = params.toString();
    const url = query ? `api/get-category-list?${query}` : 'api/get-category-list';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get single category details
  getCategoryDetail: async (categoryId) => {
    const response = await axiosInstance.get(`api/get-category-detail?category_id=${categoryId}`);
    return response.data;
  },

  // Add new category
  addCategory: async (payload) => {
    // payload: { name, status }
    const response = await axiosInstance.post('api/add-category', payload);
    return response.data;
  },

  // Update existing category
  updateCategory: async (payload) => {
    // payload: { id, name, status }
    const response = await axiosInstance.post('api/update-category', payload);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await axiosInstance.post('api/delete-category', { id });
    return response.data;
  },

  // Get products under a category
  getProductsByCategory: async (categoryId) => {
    const response = await axiosInstance.get(`api/get-products-by-category?category_id=${categoryId}`);
    return response.data;
  },
};

export default categoryService;
