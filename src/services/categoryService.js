import axiosInstance from '../api/axiosInstance';

export const categoryService = {
  // Get all categories
  getCategories: async () => {
    const response = await axiosInstance.get('api/get-category-list');
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
