import axiosInstance from '../api/axiosInstance';

export const whatsappService = {
  // Check connection status
  getStatus: async () => {
    const response = await axiosInstance.get('api/whatsapp-status');
    return response.data;
  },

  // Fetch live QR code Data URI
  getQr: async () => {
    const response = await axiosInstance.get('api/whatsapp-qr');
    return response.data;
  },

  // Disconnect / logout session
  logout: async () => {
    const response = await axiosInstance.post('api/whatsapp-logout');
    return response.data;
  },

  // Send or re-send invoice via WhatsApp
  sendInvoice: async (saleId, phone = '') => {
    const response = await axiosInstance.post('api/send-invoice-whatsapp', {
      sale_id: saleId,
      phone,
    });
    return response.data;
  },
};

export default whatsappService;
