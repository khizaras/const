import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient";

const initialFilters = {
  status: undefined,
  priority: undefined,
  search: "",
  dueBefore: undefined,
  assignedTo: undefined,
  ballInCourt: undefined,
};

export const fetchRfis = createAsyncThunk(
  "rfis/fetchRfis",
  async (_, { getState }) => {
    const { filters } = getState().rfis;
    const projectId = getState().projects.activeProjectId;
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

export const fetchRfiMetrics = createAsyncThunk(
  "rfis/fetchRfiMetrics",
  async (_, { getState }) => {
    const projectId = getState().projects.activeProjectId;
    const { data } = await apiClient.get(`/projects/${projectId}/rfis/metrics`);
    return data;
  }
);

export const createRfi = createAsyncThunk(
  "rfis/createRfi",
  async (rfiData, { getState }) => {
    const projectId = getState().projects.activeProjectId;
    const { data } = await apiClient.post(
      `/projects/${projectId}/rfis`,
      rfiData
    );
    return data;
  }
);

const rfiSlice = createSlice({
  name: "rfis",
  initialState: {
    items: [],
    meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 },
    status: "idle",
    error: null,
    metrics: { status: "idle", error: null, data: null },
    filters: initialFilters,
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
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
      })
      .addCase(createRfi.fulfilled, (state, action) => {
        // Optionally add new RFI to list
        state.items.unshift(action.payload);
      })
      .addCase(fetchRfiMetrics.pending, (state) => {
        state.metrics.status = "loading";
        state.metrics.error = null;
      })
      .addCase(fetchRfiMetrics.fulfilled, (state, action) => {
        state.metrics.status = "succeeded";
        state.metrics.data = action.payload;
      })
      .addCase(fetchRfiMetrics.rejected, (state, action) => {
        state.metrics.status = "failed";
        state.metrics.error =
          action.error.message || "Failed to load RFI metrics";
      });
  },
});

export const { setFilters } = rfiSlice.actions;
export default rfiSlice.reducer;
