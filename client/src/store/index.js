import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import rfiReducer from "../features/rfis/rfiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rfis: rfiReducer,
  },
});
