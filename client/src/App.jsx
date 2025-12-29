import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { useDispatch, useSelector } from "react-redux";
import Login from "./pages/Login";
import RfiDashboard from "./pages/RfiDashboard";
import IssuesDashboard from "./pages/IssuesDashboard";
import DocumentsDashboard from "./pages/DocumentsDashboard";
import DailyLogsDashboard from "./pages/DailyLogsDashboard";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import TeamsDashboard from "./pages/TeamsDashboard";
import SetupInstaller from "./pages/SetupInstaller";
import LayoutShell from "./components/LayoutShell";
import { fetchMe } from "./features/auth/authSlice";
import { fetchProjects } from "./features/projects/projectSlice";

const RequireAuth = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
      dispatch(fetchProjects());
    }
  }, [token, dispatch]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#0066FF",
          colorLink: "#0066FF",
          borderRadius: 10,
          colorBgContainer: "#ffffff",
          colorTextBase: "#091E42",
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Layout: {
            headerBg: "transparent",
            bodyBg: "transparent",
          },
          Card: {
            colorBgContainer: "#ffffff",
            boxShadow: "0 4px 12px rgba(9, 30, 66, 0.12)",
          },
          Menu: {
            itemBg: "transparent",
            controlHeightLG: 56,
          },
        },
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<SetupInstaller />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <LayoutShell>
                <RfiDashboard />
              </LayoutShell>
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <LayoutShell>
                <ProjectsDashboard />
              </LayoutShell>
            </RequireAuth>
          }
        />
        <Route
          path="/teams"
          element={
            <RequireAuth>
              <LayoutShell>
                <TeamsDashboard />
              </LayoutShell>
            </RequireAuth>
          }
        />
        <Route
          path="/issues"
          element={
            <RequireAuth>
              <LayoutShell>
                <IssuesDashboard />
              </LayoutShell>
            </RequireAuth>
          }
        />
        <Route
          path="/documents"
          element={
            <RequireAuth>
              <LayoutShell>
                <DocumentsDashboard />
              </LayoutShell>
            </RequireAuth>
          }
        />
        <Route
          path="/daily-logs"
          element={
            <RequireAuth>
              <LayoutShell>
                <DailyLogsDashboard />
              </LayoutShell>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
};

export default App;
