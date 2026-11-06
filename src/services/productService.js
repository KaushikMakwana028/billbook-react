import axiosInstance from '../api/axiosInstance';

export const productService = {
  // Get products (supports optional pagination, search, category filter, stock filter)
  getProducts: async ({ page, limit = 10, search = '', category_id, stock_filter = 'all', status_filter = 'all' } = {}) => {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (category_id && category_id !== 'all') params.append('category_id', category_id);
    if (stock_filter && stock_filter !== 'all') params.append('stock_filter', stock_filter);
    if (status_filter && status_filter !== 'all') params.append('status_filter', status_filter);

    const query = params.toString();
    const url = query ? `api/get-product-list?${query}` : 'api/get-product-list';
    const response = await axiosInstance.get(url);
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

  // Generate a new unique barcode
  generateBarcode: async () => {
    const response = await axiosInstance.get('api/generate-barcode');
    return response.data;
  },

  // Get printable barcode sheet data (format: "id:copies,id:copies")
  getBarcodeSheet: async (idsParam) => {
    const response = await axiosInstance.get(`api/get-barcode-sheet?ids=${encodeURIComponent(idsParam)}`);
    return response.data;
  },
};

export default productService;
