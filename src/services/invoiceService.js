import axiosInstance from '../api/axiosInstance';

export const invoiceService = {
  // Get active invoice settings & brand colors
  getInvoiceSettings: async () => {
    const response = await axiosInstance.get('api/get-invoice-settings');
    return response.data;
  },

  // Save selected template, primary color, and accent color
  saveInvoiceSettings: async ({ template_id, primary_color, accent_color }) => {
    const response = await axiosInstance.post('api/save-invoice-settings', {
      template_id,
      primary_color,
      accent_color,
    });
    return response.data;
  },

  // Upload digital signature image
  uploadSignature: async (file) => {
    const formData = new FormData();
    formData.append('signature_image', file);
    const response = await axiosInstance.post('api/upload-signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Remove signature image
  removeSignature: async () => {
    const response = await axiosInstance.post('api/remove-signature');
    return response.data;
  },

  // Get available invoice templates list
  getInvoiceTemplates: async () => {
    const response = await axiosInstance.get('api/get-invoice-templates');
    return response.data;
  },

  // Add custom invoice template
  addInvoiceTemplate: async (payload) => {
    const response = await axiosInstance.post('api/add-invoice-template', payload);
    return response.data;
  },

  // Delete custom invoice template
  deleteInvoiceTemplate: async (id) => {
    const response = await axiosInstance.post('api/delete-invoice-template', { id });
    return response.data;
  },
};

export default invoiceService;
