import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient, { getDefaultProjectId } from "../../services/apiClient";

const initialFilters = {
  status: undefined,
  priority: undefined,
  search: "",
  dueBefore: undefined,
};

export const fetchRfis = createAsyncThunk(
  "rfis/fetchRfis",
  async (_, { getState }) => {
    const { filters, projectId } = getState().rfis;
    const params = {
      page: 1,
      pageSize: 20,
      ...filters,
    };
    const { data } = await apiClient.get(`/projects/${projectId}/rfis`, {
      params,
    });
    return data;
  }
);

const rfiSlice = createSlice({
  name: "rfis",
  initialState: {
    projectId: getDefaultProjectId(),
    items: [],
    meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    status: "idle",
    error: null,
    filters: initialFilters,
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setProject(state, action) {
      state.projectId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRfis.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRfis.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchRfis.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load RFIs";
      });
  },
});

export const { setFilters, setProject } = rfiSlice.actions;
export default rfiSlice.reducer;
