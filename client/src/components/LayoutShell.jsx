import React from "react";
import { Layout, Menu, Button, Typography, Space, Tag } from "antd";
import {
  FundProjectionScreenOutlined,
  ApartmentOutlined,
  FileSearchOutlined,
  TeamOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

const { Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: "portfolio",
    icon: <FundProjectionScreenOutlined />,
    label: "Portfolio",
  },
  { key: "projects", icon: <ApartmentOutlined />, label: "Projects" },
  { key: "rfis", icon: <FileSearchOutlined />, label: "RFIs" },
  { key: "teams", icon: <TeamOutlined />, label: "Teams" },
];

const LayoutShell = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const projectId = useSelector((state) => state.rfis.projectId);

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`.toUpperCase();

  return (
    <Layout className="app-shell">
      <Header className="shell-header">
        <div className="header-container">
          <div className="header-primary">
            <div className="brand-cluster">
              <div className="brand-emblem">PC</div>
              <div className="brand-meta">
                <Text className="brand-title">Procore Console</Text>
                <span className="brand-subtitle">Enterprise RFI Hub</span>
              </div>
            </div>
            <Menu
              mode="horizontal"
              selectedKeys={["rfis"]}
              items={menuItems}
              className="shell-menu"
            />
            <div className="action-cluster">
              <Button icon={<FileTextOutlined />}>Reports</Button>
              <Button type="primary" icon={<PlusCircleOutlined />}>
                New RFI
              </Button>
              {user && <div className="user-avatar">{initials || "--"}</div>}
              <Button
                type="text"
                onClick={() => dispatch(logout())}
                className="logout-btn"
              >
                Logout
              </Button>
            </div>
          </div>
          <div className="header-context">
            <div className="project-badge">
              <span className="badge-label">Active Project</span>
              <span className="badge-value">
                North River Terminal · Package #{projectId}
              </span>
            </div>
            <div className="status-indicators">
              <span className="status-dot status-dot--live">Live</span>
              <span className="status-dot status-dot--sync">Synced</span>
            </div>
          </div>
        </div>
      </Header>
      <Content className="page-shell">{children}</Content>
    </Layout>
  );
};

export default LayoutShell;
