import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient, { setAuthToken } from "../../services/apiClient";

const persisted = (() => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("procore-auth");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
})();

const persistState = (state) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("procore-auth", JSON.stringify(state));
};

const clearProjectSelection = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("procore-active-project");
  } catch (_) {
    // ignore
  }
};

export const loginUser = createAsyncThunk("auth/login", async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
});

export const fetchMe = createAsyncThunk("auth/me", async () => {
  const { data } = await apiClient.get("/auth/me");
  return data.user;
});

const initialState = {
  token: persisted?.token || null,
  user: persisted?.user || null,
  status: "idle",
  error: null,
};

if (initialState.token) {
  setAuthToken(initialState.token);
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      setAuthToken(null);
      persistState({ token: null, user: null });
      clearProjectSelection();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        setAuthToken(action.payload.token);
        persistState({ token: state.token, user: state.user });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        persistState({ token: state.token, user: action.payload });
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
