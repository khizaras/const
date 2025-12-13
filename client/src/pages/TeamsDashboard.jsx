import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";

const { Text } = Typography;

const TeamsDashboard = () => {
  const navigate = useNavigate();
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const project = useSelector((state) => state.projects.activeProject);

  const canManageMembers = project?.project_role === "admin";

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm] = Form.useForm();

  const loadMembers = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/projects/${projectId}/users`);
      setItems(res.data?.data || []);
    } catch (_) {
      message.error("Failed to load project members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const columns = useMemo(
    () => [
      {
        title: "Name",
        key: "name",
        render: (_, r) => `${r.first_name} ${r.last_name}`.trim(),
      },
      { title: "Email", dataIndex: "email", key: "email" },
      {
        title: "Role",
        dataIndex: "project_role",
        key: "project_role",
        width: 160,
        render: (v) => (v ? <Tag>{v}</Tag> : "—"),
      },
    ],
    []
  );

  const addMember = async () => {
    if (!projectId) return;
    try {
      const values = await addForm.validateFields();
      setAdding(true);
      await apiClient.post(`/projects/${projectId}/users`, {
        email: values.email,
        role: values.role,
      });
      message.success("Member added");
      setAddOpen(false);
      addForm.resetFields();
      loadMembers();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to add member"
      );
    } finally {
      setAdding(false);
    }
  };

  if (!projectId) {
    return (
      <Card className="panel-card" bordered={false} title="Project Members">
        <Text style={{ color: "var(--neutral-600)" }}>
          Select an active project to view members.
        </Text>
        <div style={{ marginTop: 12 }}>
          <Button type="primary" onClick={() => navigate("/projects")}>
            Go to Projects
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card
        className="panel-card table-card"
        bordered={false}
        title={`Project Members${project?.name ? ` · ${project.name}` : ""}`}
        extra={
          <Space>
            {canManageMembers && (
              <Button type="primary" onClick={() => setAddOpen(true)}>
                Add Member
              </Button>
            )}
            <Button onClick={loadMembers}>Refresh</Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        open={addOpen}
        centered
        title="Add Project Member"
        okText="Add"
        confirmLoading={adding}
        onCancel={() => {
          setAddOpen(false);
          addForm.resetFields();
        }}
        onOk={addMember}
      >
        <Form
          layout="vertical"
          form={addForm}
          initialValues={{ role: "field" }}
        >
          <Form.Item
            name="email"
            label="User email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input placeholder="user@company.com" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "admin", label: "Admin" },
                { value: "pm", label: "PM" },
                { value: "reviewer", label: "Reviewer" },
                { value: "field", label: "Field" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamsDashboard;
