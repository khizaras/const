import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient";

const STORAGE_KEY = "procore-active-project";

const readStoredActiveProjectId = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
};

const writeStoredActiveProjectId = (projectId) => {
  if (typeof window === "undefined") return;
  if (!projectId) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, String(projectId));
};

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async () => {
    const res = await apiClient.get("/projects");
    return res.data?.data || [];
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (payload) => {
    const res = await apiClient.post("/projects", payload);
    return res.data?.data;
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    activeProjectId: readStoredActiveProjectId(),
    activeProject: null,
    items: [],
    status: "idle",
    error: null,
    createStatus: "idle",
    createError: null,
  },
  reducers: {
    setActiveProjectId(state, action) {
      const nextId = action.payload ? Number(action.payload) : null;
      state.activeProjectId = Number.isFinite(nextId) ? nextId : null;
      writeStoredActiveProjectId(state.activeProjectId);
      state.activeProject =
        state.items.find(
          (p) => Number(p.id) === Number(state.activeProjectId)
        ) || null;
    },
    clearActiveProject(state) {
      state.activeProjectId = null;
      state.activeProject = null;
      writeStoredActiveProjectId(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;

        const stillValid = state.items.some(
          (p) => Number(p.id) === Number(state.activeProjectId)
        );

        if (!state.activeProjectId || !stillValid) {
          const first = state.items[0];
          state.activeProjectId = first ? Number(first.id) : null;
          writeStoredActiveProjectId(state.activeProjectId);
        }

        state.activeProject =
          state.items.find(
            (p) => Number(p.id) === Number(state.activeProjectId)
          ) || null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load projects";
      })
      .addCase(createProject.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const created = action.payload;
        if (created?.id) {
          state.items = [
            created,
            ...state.items.filter((p) => p.id !== created.id),
          ];
          state.activeProjectId = Number(created.id);
          writeStoredActiveProjectId(state.activeProjectId);
          state.activeProject = created;
        }
      })
      .addCase(createProject.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.error.message || "Failed to create project";
      });
  },
});

export const { setActiveProjectId, clearActiveProject } = projectsSlice.actions;
export default projectsSlice.reducer;
