import React, { useMemo, useState } from "react";
import { Card, Table, Tag, Typography, Tooltip, Badge, Space } from "antd";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import RfiDetailModal from "./RfiDetailModal";

const { Text } = Typography;

const RfiList = () => {
  const { items, status, meta } = useSelector((state) => state.rfis);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRfiId, setSelectedRfiId] = useState(null);

  const handleRowClick = (record) => {
    setSelectedRfiId(record.id);
    setDetailModalVisible(true);
  };

  const columns = useMemo(
    () => [
      {
        title: "No.",
        dataIndex: "number",
        key: "number",
        width: 90,
        render: (_, record) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="rfi-number-pill">RFI-{record.number}</span>
            {record.days_overdue > 0 && (
              <Tooltip title={`${record.days_overdue} days overdue`}>
                <ExclamationCircleOutlined
                  style={{ color: "#ff4d4f", fontSize: 16 }}
                />
              </Tooltip>
            )}
            {record.days_until_due !== null &&
              record.days_until_due <= 3 &&
              record.days_until_due >= 0 && (
                <Tooltip title={`Due in ${record.days_until_due} days`}>
                  <WarningOutlined style={{ color: "#faad14", fontSize: 16 }} />
                </Tooltip>
              )}
          </div>
        ),
      },
      {
        title: "Request",
        dataIndex: "title",
        key: "title",
        render: (_, record) => (
          <div>
            <Text strong style={{ fontSize: "1rem" }}>
              {record.title}
            </Text>
            <div style={{ color: "var(--brand-muted)", fontSize: 12 }}>
              {record.question}
            </div>
            <div className="rfi-detail-meta">
              {record.spec_section && <span>Spec {record.spec_section}</span>}
              {record.location && <span>Location · {record.location}</span>}
              {record.discipline && <span>{record.discipline}</span>}
            </div>
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <span className={`status-pill status-pill--${status || "open"}`}>
            {status}
          </span>
        ),
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (priority) => (
          <span
            className={`priority-pill priority-pill--${priority || "medium"}`}
          >
            {priority}
          </span>
        ),
      },
      {
        title: "SLA",
        key: "sla",
        render: (_, record) => {
          const isOverdue = record.days_overdue > 0;
          const isAtRisk =
            record.days_until_due !== null && record.days_until_due <= 2;

          let color = "default";
          let label = "On track";

          if (isOverdue) {
            color = "error";
            label = `${record.days_overdue}d overdue`;
          } else if (isAtRisk) {
            color = "warning";
            label = `Due in ${record.days_until_due}d`;
          } else if (record.days_until_due === null) {
            color = "default";
            label = "No due date";
          }

          return (
            <Tag color={color} style={{ textTransform: "capitalize" }}>
              {label}
            </Tag>
          );
        },
      },
      {
        title: "Ball In Court",
        key: "bic",
        render: (_, record) => (
          <span>
            {record.ball_in_court_first_name || "—"}{" "}
            {record.ball_in_court_last_name || ""}
          </span>
        ),
      },
      {
        title: "Due",
        dataIndex: "due_date",
        key: "due_date",
        render: (due, record) => {
          if (!due) return "—";
          const isOverdue = record.days_overdue > 0;
          const isAtRisk =
            record.days_until_due !== null &&
            record.days_until_due <= 3 &&
            record.days_until_due >= 0;
          return (
            <Tooltip
              title={
                isOverdue
                  ? `${record.days_overdue} days overdue`
                  : isAtRisk
                  ? `Due in ${record.days_until_due} days`
                  : `${record.days_open} days open`
              }
            >
              <span
                style={{
                  color: isOverdue
                    ? "#ff4d4f"
                    : isAtRisk
                    ? "#faad14"
                    : "inherit",
                  fontWeight: isOverdue || isAtRisk ? 600 : 400,
                }}
              >
                {dayjs(due).format("DD MMM")}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "Updated",
        dataIndex: "updated_at",
        key: "updated_at",
        render: (value) => (value ? dayjs(value).format("DD MMM, HH:mm") : "—"),
      },
    ],
    []
  );

  return (
    <>
      <Card
        className="panel-card table-card"
        bordered={false}
        title={
          <span className="panel-title">
            <FileTextOutlined className="panel-title-icon" />
            RFI Register
          </span>
        }
        extra={
          <Space>
            <Badge status="processing" />
            <span className="panel-meta">{meta.total} active records</span>
          </Space>
        }
      >
        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={items}
          loading={status === "loading"}
          pagination={false}
          bordered={false}
          className="rfi-table"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            className: `rfi-row rfi-row--${record.status || "open"} ${
              record.days_overdue > 0 ? "rfi-row--overdue" : ""
            } ${
              record.days_until_due <= 2 && record.days_until_due >= 0
                ? "rfi-row--at-risk"
                : ""
            }`,
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      <RfiDetailModal
        visible={detailModalVisible}
        rfiId={selectedRfiId}
        onClose={() => setDetailModalVisible(false)}
      />
    </>
  );
};

export default RfiList;
