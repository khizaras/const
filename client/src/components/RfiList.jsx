import React, { useMemo } from "react";
import { Card, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const { Text } = Typography;

const RfiList = () => {
  const { items, status, meta } = useSelector((state) => state.rfis);

  const columns = useMemo(
    () => [
      {
        title: "No.",
        dataIndex: "number",
        key: "number",
        width: 90,
        render: (_, record) => (
          <span className="rfi-number-pill">RFI-{record.number}</span>
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
          const days = dayjs(due).diff(dayjs(), "day");
          const atRisk = days <= 3 && record.status !== "closed";
          return (
            <span style={{ color: atRisk ? "var(--brand-danger)" : "inherit" }}>
              {dayjs(due).format("DD MMM")}
            </span>
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
    <Card
      className="panel-card table-card"
      bordered={false}
      title="RFI Register"
      extra={
        <span style={{ color: "var(--brand-muted)" }}>
          {meta.total} active records
        </span>
      }
    >
      <Table
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={items}
        loading={status === "loading"}
        pagination={false}
        bordered={false}
      />
    </Card>
  );
};

export default RfiList;
