import React, { useEffect, useState } from "react";
import {
  Dropdown,
  List,
  Badge,
  Button,
  Typography,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import apiClient from "../services/apiClient";

dayjs.extend(relativeTime);

const { Text } = Typography;

const typeLabels = {
  rfi_created: "RFI Created",
  rfi_assigned: "RFI Assigned",
  rfi_status: "RFI Status Changed",
  rfi_response: "RFI Response",
};

const typeIcons = {
  rfi_created: "🆕",
  rfi_assigned: "👤",
  rfi_status: "🔄",
  rfi_response: "💬",
};

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/notifications", {
        params: { limit: 20 },
      });
      setNotifications(data?.data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const content = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h4>Notifications</h4>
        {unreadCount > 0 && (
          <Button
            size="small"
            type="link"
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>
      {loading ? (
        <div className="notification-loading">
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">
          <Empty
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`notification-item ${
                !item.is_read ? "notification-item--unread" : ""
              }`}
              onClick={() => handleMarkRead(item.id)}
            >
              <List.Item.Meta
                avatar={
                  <span className="notification-icon">
                    {typeIcons[item.type] || "📌"}
                  </span>
                }
                title={
                  <span className="notification-title">
                    {typeLabels[item.type] || item.type}
                  </span>
                }
                description={
                  <div className="notification-body">
                    {item.payload?.title && <div>{item.payload.title}</div>}
                    <span className="notification-time">
                      <ClockCircleOutlined />
                      {dayjs(item.created_at).fromNow()}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) fetchNotifications();
      }}
      dropdownRender={() => content}
      placement="bottomRight"
    >
      <Tooltip title="Notifications">
        <Badge count={unreadCount} size="small" offset={[-2, 6]}>
          <Button
            shape="circle"
            icon={<BellOutlined />}
            className="notification-trigger"
          />
        </Badge>
      </Tooltip>
    </Dropdown>
  );
};

export default NotificationDropdown;
