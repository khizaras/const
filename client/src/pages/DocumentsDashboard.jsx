import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Space, Table, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { downloadFileWithSignedUrl } from "../services/downloadUtils";

const DocumentsDashboard = () => {
  const navigate = useNavigate();
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 25 });
  const [search, setSearch] = useState("");

  const loadFiles = async (opts = {}) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const page = opts.page ?? meta.page;
      const pageSize = opts.pageSize ?? meta.pageSize;
      const q = opts.search ?? search;
      const res = await apiClient.get(`/projects/${projectId}/files`, {
        params: { page, pageSize, search: q || undefined },
      });
      setItems(res.data.data || []);
      setMeta(res.data.meta || meta);
    } catch (_) {
      message.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const downloadFile = async (fileId, originalName) => {
    try {
      await downloadFileWithSignedUrl(fileId, originalName);
    } catch (_) {
      message.error("Download failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "File",
        dataIndex: "original_name",
        key: "original_name",
        render: (v, r) => (
          <Button
            type="link"
            onClick={() => downloadFile(r.id, r.original_name)}
          >
            {v}
          </Button>
        ),
      },
      { title: "Type", dataIndex: "mime_type", key: "mime_type", width: 220 },
      {
        title: "Size",
        dataIndex: "size_bytes",
        key: "size_bytes",
        width: 120,
        render: (v) => (v ? `${Math.round(v / 1024)} KB` : "—"),
      },
      {
        title: "Uploaded",
        dataIndex: "created_at",
        key: "created_at",
        width: 180,
        render: (v) => (v ? dayjs(v).format("DD MMM, HH:mm") : "—"),
      },
      {
        title: "By",
        key: "uploaded_by",
        width: 160,
        render: (_, r) =>
          r.uploaded_by_first_name
            ? `${r.uploaded_by_first_name} ${
                r.uploaded_by_last_name || ""
              }`.trim()
            : "—",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, meta.page, meta.pageSize, search]
  );

  if (!projectId) {
    return (
      <Card className="panel-card" bordered={false} title="Documents">
        <p style={{ color: "var(--neutral-600)", marginBottom: 12 }}>
          Select an active project to view documents.
        </p>
        <Button type="primary" onClick={() => navigate("/projects")}>
          Go to Projects
        </Button>
      </Card>
    );
  }

  return (
    <div className="page-container">
      <Card
        className="panel-card table-card"
        bordered={false}
        title="Documents"
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={(value) => {
                setSearch(value);
                setMeta((m) => ({ ...m, page: 1 }));
                loadFiles({ page: 1, search: value });
              }}
              style={{ width: 260 }}
            />
            <Upload
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  const form = new FormData();
                  form.append("file", file);
                  await apiClient.post(`/projects/${projectId}/files`, form, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  message.success("Uploaded");
                  onSuccess && onSuccess({}, file);
                  loadFiles();
                } catch (e) {
                  message.error("Upload failed");
                  onError && onError(e);
                }
              }}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                Upload
              </Button>
            </Upload>
          </Space>
        }
      >
        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            total: meta.total,
            onChange: (page, pageSize) => {
              setMeta((m) => ({ ...m, page, pageSize }));
              loadFiles({ page, pageSize });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default DocumentsDashboard;
