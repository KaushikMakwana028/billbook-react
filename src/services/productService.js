import axiosInstance from '../api/axiosInstance';

export const productService = {
  // Get all products
  getProducts: async () => {
    const response = await axiosInstance.get('api/get-product-list');
    return response.data;
  },

  // Get single product details
  getProductDetail: async (productId) => {
    const response = await axiosInstance.get(`api/get-product-detail?product_id=${productId}`);
    return response.data;
  },

  // Add new product (supports JSON or FormData with product_image)
  addProduct: async (payload) => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.post('api/add-product', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Update existing product
  updateProduct: async (payload) => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.post('api/update-product', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await axiosInstance.post('api/delete-product', { id });
    return response.data;
  },
};

export default productService;
