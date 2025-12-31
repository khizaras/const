import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  createProject,
  fetchProjects,
  setActiveProjectId,
} from "../features/projects/projectSlice";

const { Text } = Typography;

const ProjectsDashboard = () => {
  const dispatch = useDispatch();
  const { items, status, error, activeProjectId, createStatus } = useSelector(
    (state) => state.projects
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        title: "Project",
        key: "name",
        render: (_, r) => (
          <div>
            <div style={{ fontWeight: 700 }}>{r.name}</div>
            <div style={{ color: "var(--neutral-600)", fontSize: 12 }}>
              {r.code ? `Code · ${r.code}` : ""}
            </div>
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (v) => <Tag>{v}</Tag>,
      },
      {
        title: "Role",
        dataIndex: "project_role",
        key: "project_role",
        width: 160,
        render: (v) => (v ? <Tag>{v}</Tag> : "—"),
      },
      {
        title: "Active",
        key: "active",
        width: 160,
        render: (_, r) => {
          const isActive = Number(r.id) === Number(activeProjectId);
          return (
            <Space>
              {isActive ? (
                <Tag color="blue">Active</Tag>
              ) : (
                <Button
                  onClick={() => {
                    dispatch(setActiveProjectId(r.id));
                    message.success("Active project updated");
                  }}
                >
                  Set Active
                </Button>
              )}
            </Space>
          );
        },
      },
    ],
    [activeProjectId, dispatch]
  );

  return (
    <div className="page-container">
      <Card
        className="panel-card table-card"
        bordered={false}
        title="Projects"
        extra={
          <Space>
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              New Project
            </Button>
            <Button onClick={() => dispatch(fetchProjects())}>Refresh</Button>
          </Space>
        }
      >
        {error && (
          <div style={{ marginBottom: 12 }}>
            <Text type="danger">{error}</Text>
          </div>
        )}
        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={status === "loading"}
          pagination={false}
          rowClassName={(r) =>
            Number(r.id) === Number(activeProjectId) ? "table-row--active" : ""
          }
        />
      </Card>

      <Modal
        open={createOpen}
        centered
        title="New Project"
        okText="Create"
        confirmLoading={createStatus === "loading"}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await createForm.validateFields();
            await dispatch(
              createProject({
                name: values.name,
                code: values.code || null,
              })
            ).unwrap();
            message.success("Project created");
            setCreateOpen(false);
            createForm.resetFields();
          } catch (err) {
            if (err?.errorFields) return;
            message.error("Failed to create project");
          }
        }}
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item
            name="name"
            label="Project name"
            rules={[{ required: true, min: 2 }]}
          >
            <Input placeholder="e.g., North River Terminal" />
          </Form.Item>
          <Form.Item name="code" label="Code (optional)">
            <Input placeholder="e.g., NRT-001" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsDashboard;
