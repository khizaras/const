import React from "react";
import { Layout, Menu, Button, Typography, Select, Tooltip, Badge } from "antd";
import {
  FundProjectionScreenOutlined,
  ApartmentOutlined,
  FileSearchOutlined,
  CheckSquareOutlined,
  FolderOpenOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { setActiveProjectId } from "../features/projects/projectSlice";
import NotificationDropdown from "./NotificationDropdown";

const { Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: "portfolio",
    icon: <FundProjectionScreenOutlined />,
    label: "Portfolio",
    disabled: true,
  },
  {
    key: "projects",
    icon: <ApartmentOutlined />,
    label: "Projects",
  },
  { key: "rfis", icon: <FileSearchOutlined />, label: "RFIs" },
  { key: "issues", icon: <CheckSquareOutlined />, label: "Issues" },
  { key: "daily-logs", icon: <CalendarOutlined />, label: "Daily Logs" },
  { key: "documents", icon: <FolderOpenOutlined />, label: "Documents" },
  { key: "teams", icon: <TeamOutlined />, label: "Teams" },
];

const LayoutShell = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const activeProjectId = useSelector(
    (state) => state.projects.activeProjectId
  );
  const activeProject = useSelector((state) => state.projects.activeProject);
  const projects = useSelector((state) => state.projects.items);

  const selectedKey = location.pathname.startsWith("/projects")
    ? "projects"
    : location.pathname.startsWith("/teams")
    ? "teams"
    : location.pathname.startsWith("/issues")
    ? "issues"
    : location.pathname.startsWith("/daily-logs")
    ? "daily-logs"
    : location.pathname.startsWith("/documents")
    ? "documents"
    : "rfis";

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`.toUpperCase();

  return (
    <Layout className="app-shell">
      <Header className="shell-header">
        <div className="header-container">
          <div className="header-primary">
            <div className="brand-cluster">
              <div className="brand-emblem">
                <ThunderboltOutlined />
              </div>
              <div className="brand-meta">
                <Text className="brand-title">Procore Console</Text>
                <span className="brand-subtitle">Enterprise RFI Hub</span>
              </div>
            </div>
            <Menu
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={menuItems}
              className="shell-menu"
              onClick={({ key }) => {
                if (key === "projects") navigate("/projects");
                if (key === "rfis") navigate("/");
                if (key === "issues") navigate("/issues");
                if (key === "daily-logs") navigate("/daily-logs");
                if (key === "documents") navigate("/documents");
                if (key === "teams") navigate("/teams");
              }}
            />
            <div className="action-cluster">
              <Tooltip title="View Reports">
                <Button icon={<FileTextOutlined />} className="action-btn">
                  Reports
                </Button>
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                className="btn-create-rfi"
              >
                New RFI
              </Button>
              <NotificationDropdown />
              <Tooltip
                title={user ? `${user.firstName} ${user.lastName}` : "User"}
              >
                <div className="user-avatar">{initials || "--"}</div>
              </Tooltip>
              <Tooltip title="Sign Out">
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={() => dispatch(logout())}
                  className="logout-btn"
                />
              </Tooltip>
            </div>
          </div>
          <div className="header-context">
            <div className="project-badge">
              <span className="badge-label">Active Project</span>
              <span className="badge-value">
                {projects?.length ? (
                  <Select
                    value={activeProjectId ?? undefined}
                    placeholder="Select project"
                    style={{ minWidth: 260 }}
                    options={projects.map((p) => ({
                      value: Number(p.id),
                      label: p.name,
                    }))}
                    onChange={(value) => {
                      dispatch(setActiveProjectId(value));
                    }}
                  />
                ) : activeProject?.name ? (
                  activeProject.name
                ) : activeProjectId ? (
                  `Project #${activeProjectId}`
                ) : (
                  "No project selected"
                )}
              </span>
            </div>
            <div className="status-indicators">
              <Badge status="processing" />
              <span className="status-dot status-dot--live">
                <CheckCircleOutlined /> Live
              </span>
              <span className="status-dot status-dot--sync">
                <SyncOutlined spin /> Synced
              </span>
            </div>
          </div>
        </div>
      </Header>
      <Content className="page-shell">{children}</Content>
    </Layout>
  );
};

export default LayoutShell;
