import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";
import apiClient from "../services/apiClient";

const { Title, Text } = Typography;

const SetupInstaller = () => {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [result, setResult] = useState(null);
  const [form] = Form.useForm();

  const enabled = status?.enabled?.enabled === true;
  const enabledReason = status?.enabled?.reason;
  const dbOk = status?.db?.ok === true;

  const installedSummary = useMemo(() => {
    const installed = status?.installed || {};
    const keys = Object.keys(installed);
    if (!keys.length) return "";
    const ok = keys.filter((k) => installed[k]).length;
    return `${ok}/${keys.length} tables detected`;
  }, [status]);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await apiClient.get("/setup/status");
      setStatus(res.data);
    } catch (e) {
      message.error(
        e?.response?.data?.error || e?.message || "Failed to load setup status"
      );
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runInstall = async () => {
    const values = await form.validateFields();

    setInstalling(true);
    setResult(null);
    try {
      const res = await apiClient.post(
        "/setup/install",
        {
          seed: {
            organizationName: values.organizationName,
            adminEmail: values.adminEmail,
            adminPassword: values.adminPassword,
            adminFirstName: values.adminFirstName,
            adminLastName: values.adminLastName,
            projectName: values.projectName,
            projectCode: values.projectCode,
          },
        },
        {
          headers: {
            "x-setup-token": values.setupToken,
          },
        }
      );
      setResult(res.data);
      message.success("Installer finished");
      await loadStatus();
    } catch (e) {
      message.error(
        e?.response?.data?.error || e?.message || "Installer failed"
      );
      setResult(e?.response?.data || { error: e?.message });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: "32px auto", padding: "0 16px" }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        Setup Installer
      </Title>
      <Text type="secondary">
        One-click database installer (gated by server env + token).
      </Text>

      <div style={{ height: 16 }} />

      {!enabled && (
        <Alert
          type="warning"
          showIcon
          message="Installer is disabled"
          description={
            enabledReason ||
            "Set ENABLE_SETUP_UI=true and SETUP_TOKEN (min 16 chars) on the server."
          }
        />
      )}

      <div style={{ height: 16 }} />

      <Card
        title="Status"
        loading={loadingStatus}
        extra={
          <Button onClick={loadStatus} disabled={loadingStatus}>
            Refresh
          </Button>
        }
      >
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="DB">
            {dbOk ? "OK" : "Not connected"}
          </Descriptions.Item>
          <Descriptions.Item label="Database">
            {status?.db?.database || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Host">
            {status?.db?.host ? `${status.db.host}:${status.db.port}` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="User">
            {status?.db?.user || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Installed">
            {installedSummary || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Counts">
            orgs: {status?.counts?.organizations ?? "-"}, users:{" "}
            {status?.counts?.users ?? "-"}, projects:{" "}
            {status?.counts?.projects ?? "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div style={{ height: 16 }} />

      <Card title="Run Installer">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ projectCode: "DEMO-001" }}
        >
          <Form.Item
            name="setupToken"
            label="Setup Token"
            rules={[{ required: true, message: "Setup token is required" }]}
          >
            <Input.Password autoComplete="off" placeholder="x-setup-token" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="What this does"
            description="Applies schema + module tables. If the database has zero users, it also creates an initial org + admin + demo project (requires Admin Password). If users already exist, seeding is skipped automatically."
          />

          <div style={{ height: 12 }} />

          <Space size={12} wrap style={{ width: "100%" }}>
            <Form.Item name="organizationName" label="Organization Name">
              <Input placeholder="Procore" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="projectName" label="Project Name">
              <Input placeholder="Demo Project" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="projectCode" label="Project Code">
              <Input placeholder="DEMO-001" style={{ width: 160 }} />
            </Form.Item>
          </Space>

          <Space size={12} wrap style={{ width: "100%" }}>
            <Form.Item name="adminFirstName" label="Admin First Name">
              <Input placeholder="Admin" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="adminLastName" label="Admin Last Name">
              <Input placeholder="User" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="adminEmail" label="Admin Email">
              <Input placeholder="admin@example.com" style={{ width: 280 }} />
            </Form.Item>
          </Space>

          <Form.Item
            name="adminPassword"
            label="Admin Password (required only if no users exist)"
          >
            <Input.Password
              placeholder="Minimum 10 characters"
              autoComplete="new-password"
            />
          </Form.Item>

          <Button
            type="primary"
            onClick={runInstall}
            loading={installing}
            disabled={!enabled || !dbOk}
          >
            Run Installer
          </Button>
        </Form>
      </Card>

      {result && (
        <>
          <div style={{ height: 16 }} />
          <Card title="Result">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
};

export default SetupInstaller;
