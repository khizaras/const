import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Upload,
  List,
  Avatar,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";

const shiftOptions = [
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

const DailyLogsDashboard = () => {
  const navigate = useNavigate();
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20 });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const downloadFile = async (fileId, originalName) => {
    try {
      const res = await apiClient.get(`/files/${fileId}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName || `file-${fileId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) {
      message.error("Download failed");
    }
  };

  const uploadAndAttachToLog = async (file) => {
    if (!projectId || !selected?.id) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await apiClient.post(
        `/projects/${projectId}/files`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const fileId = uploaded.data?.id || uploaded.data;
      await apiClient.post(
        `/projects/${projectId}/daily-logs/${selected.id}/attachments`,
        { fileId: typeof fileId === "object" ? fileId.id : fileId }
      );
      message.success("Attachment added");
      openDetail(selected);
    } catch (e) {
      message.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to upload attachment"
      );
    }
  };

  const removeAttachment = async (attachmentId) => {
    if (!projectId || !selected?.id) return;
    try {
      await apiClient.delete(
        `/projects/${projectId}/daily-logs/${selected.id}/attachments/${attachmentId}`
      );
      message.success("Attachment removed");
      openDetail(selected);
    } catch (e) {
      message.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to remove attachment"
      );
    }
  };

  const loadLogs = async (opts = {}) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const page = opts.page ?? meta.page;
      const pageSize = opts.pageSize ?? meta.pageSize;
      const res = await apiClient.get(`/projects/${projectId}/daily-logs`, {
        params: { page, pageSize },
      });
      setItems(res.data.data || []);
      setMeta(res.data.meta || meta);
    } catch (_) {
      message.error("Failed to load daily logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const columns = useMemo(
    () => [
      {
        title: "Date",
        dataIndex: "log_date",
        key: "log_date",
        width: 140,
        render: (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—"),
      },
      { title: "Shift", dataIndex: "shift", key: "shift", width: 110 },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (v) => (
          <span
            className={`status-pill status-pill--${
              v === "draft" ? "open" : "closed"
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        title: "Weather",
        dataIndex: "weather_conditions",
        key: "weather_conditions",
        width: 200,
        render: (v) => v || "—",
      },
      {
        title: "Work Summary",
        dataIndex: "work_summary",
        key: "work_summary",
        render: (v) => (v ? String(v).slice(0, 80) : "—"),
      },
      {
        title: "Updated",
        dataIndex: "updated_at",
        key: "updated_at",
        width: 170,
        render: (v) => (v ? dayjs(v).format("DD MMM, HH:mm") : "—"),
      },
    ],
    []
  );

  const createLog = async () => {
    if (!projectId) return;
    try {
      const values = await form.validateFields();
      const payload = {
        logDate: values.logDate.format("YYYY-MM-DD"),
        shift: values.shift,
        status: values.status,
        weatherConditions: values.weatherConditions || null,
        workSummary: values.workSummary || null,
        safetyNotes: values.safetyNotes || null,
        delaysIssues: values.delaysIssues || null,
        labor: values.labor || [],
        equipment: values.equipment || [],
      };
      await apiClient.post(`/projects/${projectId}/daily-logs`, payload);
      message.success("Daily log created");
      setCreateOpen(false);
      form.resetFields();
      loadLogs();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to create daily log");
    }
  };

  const openDetail = async (row) => {
    if (!projectId) return;
    setSelected(row);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(
        `/projects/${projectId}/daily-logs/${row.id}`
      );
      setSelected(res.data);
      detailForm.setFieldsValue({
        logDate: res.data.log_date ? dayjs(res.data.log_date) : null,
        shift: res.data.shift,
        status: res.data.status,
        weatherConditions: res.data.weather_conditions,
        workSummary: res.data.work_summary,
        safetyNotes: res.data.safety_notes,
        delaysIssues: res.data.delays_issues,
        labor:
          (res.data.labor || []).map((l) => ({
            trade: l.trade,
            headcount: l.headcount,
          })) || [],
        equipment:
          (res.data.equipment || []).map((e) => ({
            equipmentName: e.equipment_name,
            hours: e.hours,
          })) || [],
      });
    } catch (_) {
      message.error("Failed to load daily log");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    if (!projectId || !selected?.id) return;
    try {
      const values = await detailForm.validateFields();
      const payload = {
        logDate: values.logDate
          ? values.logDate.format("YYYY-MM-DD")
          : undefined,
        shift: values.shift,
        status: values.status,
        weatherConditions: values.weatherConditions || null,
        workSummary: values.workSummary || null,
        safetyNotes: values.safetyNotes || null,
        delaysIssues: values.delaysIssues || null,
        labor: values.labor || [],
        equipment: values.equipment || [],
      };
      await apiClient.patch(
        `/projects/${projectId}/daily-logs/${selected.id}`,
        payload
      );
      message.success("Daily log updated");
      setDetailOpen(false);
      setSelected(null);
      detailForm.resetFields();
      loadLogs();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to update daily log");
    }
  };

  if (!projectId) {
    return (
      <Card className="panel-card" bordered={false} title="Daily Logs">
        <p style={{ color: "var(--neutral-600)", marginBottom: 12 }}>
          Select an active project to view daily logs.
        </p>
        <Button type="primary" onClick={() => navigate("/projects")}>
          Go to Projects
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <Card
        className="panel-card table-card"
        bordered={false}
        title="Daily Logs"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            New Daily Log
          </Button>
        }
      >
        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={loading}
          onRow={(record) => ({ onClick: () => openDetail(record) })}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            total: meta.total,
            onChange: (page, pageSize) => {
              setMeta((m) => ({ ...m, page, pageSize }));
              loadLogs({ page, pageSize });
            },
          }}
        />
      </Card>

      <Modal
        open={createOpen}
        title="Create Daily Log"
        onCancel={() => setCreateOpen(false)}
        onOk={createLog}
        okText="Create"
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            shift: "day",
            status: "draft",
            labor: [],
            equipment: [],
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="logDate"
                label="Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shift"
                label="Shift"
                rules={[{ required: true }]}
              >
                <Select options={shiftOptions} />
              </Form.Item>
            </Col>
          </Row>

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
              <Form.Item name="weatherConditions" label="Weather (optional)">
                <Input placeholder="e.g., Sunny, 28°C" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="workSummary" label="Work Summary (optional)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="safetyNotes" label="Safety Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="delaysIssues" label="Delays / Issues (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={detailOpen}
        title={
          selected
            ? `Daily Log · ${dayjs(selected.log_date).format(
                "DD MMM YYYY"
              )} · ${selected.shift}`
            : "Daily Log"
        }
        onCancel={() => {
          setDetailOpen(false);
          setSelected(null);
          detailForm.resetFields();
        }}
        onOk={saveDetail}
        okText="Save"
        confirmLoading={detailLoading}
      >
        <Form layout="vertical" form={detailForm}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="logDate"
                label="Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shift"
                label="Shift"
                rules={[{ required: true }]}
              >
                <Select options={shiftOptions} />
              </Form.Item>
            </Col>
          </Row>

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
              <Form.Item name="weatherConditions" label="Weather (optional)">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="workSummary" label="Work Summary (optional)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="safetyNotes" label="Safety Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="delaysIssues" label="Delays / Issues (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.List name="labor">
                {(fields, { add, remove }) => (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      Labor (optional)
                    </div>
                    {fields.map((field) => (
                      <Row
                        gutter={8}
                        key={field.key}
                        style={{ marginBottom: 8 }}
                      >
                        <Col span={14}>
                          <Form.Item
                            {...field}
                            name={[field.name, "trade"]}
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="Trade" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...field}
                            name={[field.name, "headcount"]}
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="#" />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Button onClick={() => remove(field.name)}>-</Button>
                        </Col>
                      </Row>
                    ))}
                    <Button onClick={() => add()} block>
                      Add labor
                    </Button>
                  </div>
                )}
              </Form.List>
            </Col>
            <Col span={12}>
              <Form.List name="equipment">
                {(fields, { add, remove }) => (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      Equipment (optional)
                    </div>
                    {fields.map((field) => (
                      <Row
                        gutter={8}
                        key={field.key}
                        style={{ marginBottom: 8 }}
                      >
                        <Col span={14}>
                          <Form.Item
                            {...field}
                            name={[field.name, "equipmentName"]}
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="Equipment" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...field}
                            name={[field.name, "hours"]}
                            rules={[{ required: true }]}
                          >
                            <Input placeholder="Hours" />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Button onClick={() => remove(field.name)}>-</Button>
                        </Col>
                      </Row>
                    ))}
                    <Button onClick={() => add()} block>
                      Add equipment
                    </Button>
                  </div>
                )}
              </Form.List>
            </Col>
          </Row>

          <Card
            size="small"
            title={`Attachments (${(selected?.attachments || []).length})`}
            style={{ marginTop: 12 }}
          >
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                uploadAndAttachToLog(file);
                return false;
              }}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                Upload
              </Button>
            </Upload>

            <div style={{ height: 12 }} />

            <List
              dataSource={selected?.attachments || []}
              locale={{ emptyText: "No attachments yet." }}
              renderItem={(a) => (
                <List.Item
                  actions={[
                    <Button
                      key="download"
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadFile(a.file_id, a.original_name)}
                    >
                      Download
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Remove this attachment?"
                      okText="Remove"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                      onConfirm={() => removeAttachment(a.id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        Remove
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{(a.original_name || "?")[0]}</Avatar>}
                    title={a.original_name}
                    description={`${Math.round(
                      (a.size_bytes || 0) / 1024
                    )} KB • ${dayjs(a.attached_at).format("DD MMM, HH:mm")}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyLogsDashboard;
