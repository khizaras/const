import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import rfiReducer from "../features/rfis/rfiSlice";
import projectsReducer from "../features/projects/projectSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    rfis: rfiReducer,
  },
});
