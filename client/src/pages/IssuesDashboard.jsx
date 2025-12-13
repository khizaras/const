import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";

const typeOptions = [
  { value: "issue", label: "Issue" },
  { value: "punch", label: "Punch" },
  { value: "observation", label: "Observation" },
];

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const IssuesDashboard = () => {
  const navigate = useNavigate();
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const loadUsers = async () => {
    if (!projectId) return;
    try {
      const res = await apiClient.get(`/projects/${projectId}/users`);
      setUsers(res.data?.data || []);
    } catch (_) {
      // ignore; assignment will just be empty
    }
  };

  const loadIssues = async (opts = {}) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const page = opts.page ?? meta.page;
      const pageSize = opts.pageSize ?? meta.pageSize;
      const res = await apiClient.get(`/projects/${projectId}/issues`, {
        params: { page, pageSize },
      });
      setItems(res.data.data || []);
      setMeta(res.data.meta || meta);
    } catch (err) {
      message.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const columns = useMemo(
    () => [
      {
        title: "No.",
        dataIndex: "number",
        key: "number",
        width: 90,
        render: (v, r) => (
          <span className="rfi-number-pill">ISS-{r.number}</span>
        ),
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (_, r) => (
          <div>
            <div style={{ fontWeight: 700 }}>{r.title}</div>
            <div style={{ color: "var(--neutral-600)", fontSize: 12 }}>
              {r.location ? `Location · ${r.location}` : ""}
              {r.trade ? `  ·  ${r.trade}` : ""}
            </div>
          </div>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (v) => <Tag>{v}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (v) => (
          <span
            className={`status-pill status-pill--${
              v === "in_progress" ? "answered" : v
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        width: 120,
        render: (v) => (
          <span className={`priority-pill priority-pill--${v || "medium"}`}>
            {v}
          </span>
        ),
      },
      {
        title: "Due",
        dataIndex: "due_date",
        key: "due_date",
        width: 120,
        render: (v) => (v ? dayjs(v).format("DD MMM") : "—"),
      },
      {
        title: "Updated",
        dataIndex: "updated_at",
        key: "updated_at",
        width: 160,
        render: (v) => (v ? dayjs(v).format("DD MMM, HH:mm") : "—"),
      },
    ],
    []
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await apiClient.post(`/projects/${projectId}/issues`, values);
      message.success("Issue created");
      setCreateOpen(false);
      form.resetFields();
      loadIssues();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to create issue");
    }
  };

  const openDetail = async (issue) => {
    if (!projectId) return;
    setSelectedIssue(issue);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(
        `/projects/${projectId}/issues/${issue.id}`
      );
      setSelectedIssue(res.data);
      detailForm.setFieldsValue({
        status: res.data.status,
        priority: res.data.priority,
        assignedToUserId: res.data.assigned_to_user_id ?? null,
      });
    } catch (_) {
      message.error("Failed to load issue");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    if (!projectId || !selectedIssue?.id) return;
    try {
      const values = await detailForm.validateFields();
      await apiClient.patch(
        `/projects/${projectId}/issues/${selectedIssue.id}`,
        values
      );
      message.success("Issue updated");
      setDetailOpen(false);
      setSelectedIssue(null);
      detailForm.resetFields();
      loadIssues();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to update issue");
    }
  };

  if (!projectId) {
    return (
      <Card className="panel-card" bordered={false} title="Issues & Punch">
        <p style={{ color: "var(--neutral-600)", marginBottom: 12 }}>
          Select an active project to view issues.
        </p>
        <Button type="primary" onClick={() => navigate("/projects")}>
          Go to Projects
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-grid__item">
          <div className="stat-grid__label">Issues</div>
          <div className="stat-grid__value">{meta.total}</div>
          <small style={{ color: "var(--neutral-600)" }}>Project total</small>
        </div>
      </div>

      <Card
        className="panel-card table-card"
        bordered={false}
        title="Issues & Punch"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            New Issue
          </Button>
        }
      >
        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={loading}
          onRow={(record) => ({
            onClick: () => openDetail(record),
          })}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            total: meta.total,
            onChange: (page, pageSize) => {
              setMeta((m) => ({ ...m, page, pageSize }));
              loadIssues({ page, pageSize });
            },
          }}
        />
      </Card>

      <Modal
        open={createOpen}
        title="Create Issue"
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Create"
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ type: "issue", status: "open", priority: "medium" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={typeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
              >
                <Select options={priorityOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, min: 3 }]}
          >
            <Input placeholder="e.g., Door hardware conflict" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="What’s wrong and what’s needed?"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="trade" label="Trade (optional)">
                <Input placeholder="e.g., Electrical" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Location (optional)">
                <Input placeholder="e.g., Level 2 · Corridor" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assignedToUserId" label="Assign To (optional)">
            <Select
              allowClear
              options={users.map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name}`,
              }))}
              placeholder="Select a project member"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={detailOpen}
        title={
          selectedIssue
            ? `ISS-${selectedIssue.number} · ${selectedIssue.title}`
            : "Issue"
        }
        onCancel={() => {
          setDetailOpen(false);
          setSelectedIssue(null);
          detailForm.resetFields();
        }}
        onOk={saveDetail}
        okText="Save"
        confirmLoading={detailLoading}
      >
        {selectedIssue && (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div style={{ color: "var(--neutral-700)" }}>
              {selectedIssue.description}
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: "var(--neutral-600)", fontSize: 12 }}>
                  Type
                </div>
                <Tag>{selectedIssue.type}</Tag>
              </Col>
              <Col span={12}>
                <div style={{ color: "var(--neutral-600)", fontSize: 12 }}>
                  Created
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedIssue.created_at
                    ? dayjs(selectedIssue.created_at).format("DD MMM, HH:mm")
                    : "—"}
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: "var(--neutral-600)", fontSize: 12 }}>
                  Trade
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedIssue.trade || "—"}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ color: "var(--neutral-600)", fontSize: 12 }}>
                  Location
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedIssue.location || "—"}
                </div>
              </Col>
            </Row>

            <Form layout="vertical" form={detailForm}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true }]}
                  >
                    <Select options={statusOptions} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label="Priority"
                    rules={[{ required: true }]}
                  >
                    <Select options={priorityOptions} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="assignedToUserId" label="Assign To (optional)">
                <Select
                  allowClear
                  options={users.map((u) => ({
                    value: u.id,
                    label: `${u.first_name} ${u.last_name}`,
                  }))}
                  placeholder="Select a project member"
                />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default IssuesDashboard;
