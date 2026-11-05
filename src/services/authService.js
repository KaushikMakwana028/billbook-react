import axiosInstance from '../api/axiosInstance';

export const authService = {
  // Send OTP for login
  sendLoginOtp: async (mobile) => {
    const response = await axiosInstance.post('api/send-otp', { mobile });
    return response.data;
  },

  // Verify OTP for login
  verifyLoginOtp: async (mobile, otp) => {
    const response = await axiosInstance.post('api/verify-otp', { mobile, otp });
    return response.data;
  },

  // Step 1: Register (Sends OTP to mobile)
  registerUser: async (email, mobile) => {
    const response = await axiosInstance.post('api/register', { email, mobile });
    return response.data;
  },

  // Step 2: Verify Registration OTP
  verifyRegisterOtp: async (payload) => {
    // payload: { mobile, otp, full_name, business_name, email }
    const response = await axiosInstance.post('api/register-verify-otp', payload);
    return response.data;
  },

  // Get current user profile
  getMyProfile: async () => {
    const response = await axiosInstance.get('api/get-my-profile');
    return response.data;
  },

  // Update profile (accepts JSON object or FormData for image upload)
  updateMyProfile: async (payload) => {
    const isFormData = payload instanceof FormData;
    const response = await axiosInstance.post('api/update-my-profile', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Logout from server
  logout: async () => {
    try {
      await axiosInstance.post('api/logout');
    } catch {
      // Ignore errors on logout
    }
  },
};

export default authService;
