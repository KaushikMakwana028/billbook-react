import { createSlice } from '@reduxjs/toolkit';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('billbook_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  token: localStorage.getItem('billbook_token') || null,
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('billbook_token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      if (token) localStorage.setItem('billbook_token', token);
      if (user) localStorage.setItem('billbook_user', JSON.stringify(user));
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('billbook_user', JSON.stringify(state.user));
    },
    logoutUser: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('billbook_token');
      localStorage.removeItem('billbook_user');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCredentials, updateUser, logoutUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
