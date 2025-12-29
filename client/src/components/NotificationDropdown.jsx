import React, { useEffect, useState } from "react";
import { Dropdown, List, Badge, Button, Typography, Empty, Spin } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
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
    <div style={{ width: 340, maxHeight: 400, overflowY: "auto", padding: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text strong>Notifications</Text>
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
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description="No notifications"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                background: item.is_read ? "transparent" : "#e6f7ff",
                padding: "8px 4px",
                borderRadius: 4,
                marginBottom: 4,
                cursor: "pointer",
              }}
              onClick={() => handleMarkRead(item.id)}
            >
              <List.Item.Meta
                title={
                  <Text strong={!item.is_read}>
                    {typeLabels[item.type] || item.type}
                  </Text>
                }
                description={
                  <div style={{ fontSize: 12 }}>
                    {item.payload?.title && <div>{item.payload.title}</div>}
                    <Text type="secondary">
                      {dayjs(item.created_at).fromNow()}
                    </Text>
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
      <Badge count={unreadCount} size="small" offset={[-2, 6]}>
        <Button shape="circle" icon={<BellOutlined />} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
