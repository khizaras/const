import React, { useState, useEffect } from "react";
import {
  Modal,
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Form,
  Input,
  Upload,
  message,
  List,
  Avatar,
  Typography,
  Card,
  Image,
  Select,
  Popconfirm,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  SendOutlined,
  FileOutlined,
  CloseOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../services/apiClient";
import { useSelector } from "react-redux";

const { TextArea } = Input;
const { Text, Title } = Typography;

const RfiDetailModal = ({ visible, rfiId, onClose }) => {
  const [rfi, setRfi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [watcherBusyId, setWatcherBusyId] = useState(null);
  const [watcherSelectValue, setWatcherSelectValue] = useState(undefined);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const project = useSelector((state) => state.projects.activeProject);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (visible && rfiId) {
      loadRfiDetail();
      loadProjectUsers();
    }
  }, [visible, rfiId]);

  const loadRfiDetail = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/projects/${projectId}/rfis/${rfiId}`
      );
      setRfi(response.data);
      const auditsRes = await apiClient.get(
        `/projects/${projectId}/rfis/${rfiId}/audit`
      );
      setAuditLogs(auditsRes.data?.data || []);
    } catch (error) {
      message.error("Failed to load RFI details");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectUsers = async () => {
    if (!projectId) return;
    setLoadingUsers(true);
    try {
      const res = await apiClient.get(`/projects/${projectId}/users`);
      setProjectUsers(res.data?.data || []);
    } catch (_) {
      setProjectUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddResponse = async () => {
    if (!responseText.trim()) {
      message.warning("Please enter a response");
      return;
    }

    setResponding(true);
    try {
      await apiClient.post(`/projects/${projectId}/rfis/${rfiId}/responses`, {
        responseText: responseText.trim(),
        isOfficial: false,
      });
      message.success("Response added");
      setResponseText("");
      loadRfiDetail();
    } catch (error) {
      message.error("Failed to add response");
    } finally {
      setResponding(false);
    }
  };

  const canDeleteComment = (c) => {
    const role = project?.project_role;
    return (
      (user?.id && Number(c.author_user_id) === Number(user.id)) ||
      role === "admin" ||
      role === "pm"
    );
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      message.warning("Please enter a comment");
      return;
    }
    setCommenting(true);
    try {
      await apiClient.post(`/projects/${projectId}/rfis/${rfiId}/comments`, {
        body: commentText.trim(),
      });
      message.success("Comment added");
      setCommentText("");
      loadRfiDetail();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to add comment"
      );
    } finally {
      setCommenting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await apiClient.delete(
        `/projects/${projectId}/rfis/${rfiId}/comments/${commentId}`
      );
      message.success("Comment deleted");
      loadRfiDetail();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to delete comment"
      );
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiClient.patch(`/projects/${projectId}/rfis/${rfiId}`, {
        status: newStatus,
      });
      message.success(`RFI status changed to ${newStatus}`);
      loadRfiDetail();
    } catch (error) {
      message.error("Failed to update RFI status");
    }
  };

  const addWatcher = async (userId) => {
    if (!projectId || !rfiId || !userId) return;
    setWatcherBusyId(Number(userId));
    try {
      await apiClient.post(`/projects/${projectId}/rfis/${rfiId}/watchers`, {
        userId,
      });
      message.success("Watcher added");
      setWatcherSelectValue(undefined);
      loadRfiDetail();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to add watcher"
      );
    } finally {
      setWatcherBusyId(null);
    }
  };

  const removeWatcher = async (userId) => {
    if (!projectId || !rfiId || !userId) return;
    setWatcherBusyId(Number(userId));
    try {
      await apiClient.delete(
        `/projects/${projectId}/rfis/${rfiId}/watchers/${userId}`
      );
      message.success("Watcher removed");
      loadRfiDetail();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to remove watcher"
      );
    } finally {
      setWatcherBusyId(null);
    }
  };

  const handleDownloadFile = async (fileId, filename) => {
    try {
      const response = await apiClient.get(`/files/${fileId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("Failed to download file");
    }
  };

  const getMimeType = (file) => file?.mimetype || file?.mime_type || "";

  const isImageFile = (mimetype) => {
    return mimetype && mimetype.startsWith("image/");
  };

  const isPdfFile = (mimetype) => {
    return mimetype === "application/pdf";
  };

  const handlePreview = async (fileId, filename, mimetypeOrFile) => {
    const mimeType =
      typeof mimetypeOrFile === "string"
        ? mimetypeOrFile
        : getMimeType(mimetypeOrFile);

    if (isImageFile(mimeType)) {
      try {
        const response = await apiClient.get(`/files/${fileId}/download`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setPreviewImage(url);
        setPreviewTitle(filename);
        setPreviewVisible(true);
      } catch (error) {
        message.error("Failed to preview file");
      }
    } else if (isPdfFile(mimeType)) {
      // Open PDF in new tab
      try {
        const response = await apiClient.get(`/files/${fileId}/download`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        window.open(url, "_blank");
      } catch (error) {
        message.error("Failed to preview PDF");
      }
    }
  };

  const getFileIcon = (mimetype) => {
    if (isImageFile(mimetype)) {
      return <FileImageOutlined style={{ fontSize: 24, color: "#1890ff" }} />;
    } else if (isPdfFile(mimetype)) {
      return <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />;
    }
    return <FileOutlined style={{ fontSize: 24 }} />;
  };

  const uploadAndAttach = async (file) => {
    if (!projectId || !rfiId) return false;
    const uid = file.uid || `${Date.now()}`;
    setAttaching(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await apiClient.post(
        `/projects/${projectId}/files`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setUploadProgress((prev) => ({ ...prev, [uid]: pct }));
          },
        }
      );

      const fileId =
        uploadRes.data?.id || uploadRes.data?.fileId || uploadRes.data;
      if (!fileId) throw new Error("File upload did not return an id");

      await apiClient.post(`/projects/${projectId}/rfis/${rfiId}/attachments`, {
        fileId,
      });

      message.success(`${file.name} attached`);
      setUploadProgress((prev) => ({ ...prev, [uid]: 100 }));
      loadRfiDetail();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to attach file";
      message.error(msg);
    } finally {
      setAttaching(false);
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
      }, 1000);
    }
    return false;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "blue",
      answered: "green",
      closed: "default",
      void: "red",
    };
    return colors[status] || "default";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "default",
      medium: "blue",
      high: "orange",
      urgent: "red",
    };
    return colors[priority] || "default";
  };

  if (!rfi) {
    return (
      <Drawer
        title={
          <Title level={3} style={{ margin: 0 }}>
            RFI Details
          </Title>
        }
        open={visible}
        onClose={onClose}
        width="100%"
        height="100vh"
        placement="right"
        closeIcon={<CloseOutlined style={{ fontSize: 18 }} />}
        bodyStyle={{
          paddingTop: 24,
          background: "#f5f5f5",
        }}
        headerStyle={{
          borderBottom: "1px solid #e8e8e8",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "white",
            padding: "32px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          Loading...
        </div>
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Space>
              <Title level={3} style={{ margin: 0 }}>
                RFI-{rfi.number}
              </Title>
              <Tag color={getStatusColor(rfi.status)}>{rfi.status}</Tag>
              <Tag color={getPriorityColor(rfi.priority)}>{rfi.priority}</Tag>
            </Space>
            <Space>
              {rfi.status === "open" && (
                <Popconfirm
                  title="Mark as Answered?"
                  description="This will change the status to 'answered'."
                  onConfirm={() => handleStatusChange("answered")}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    size="small"
                  >
                    Mark Answered
                  </Button>
                </Popconfirm>
              )}
              {rfi.status === "answered" && (
                <Popconfirm
                  title="Close this RFI?"
                  description="This will mark the RFI as closed."
                  onConfirm={() => handleStatusChange("closed")}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    icon={<CloseCircleOutlined />}
                    size="small"
                  >
                    Close RFI
                  </Button>
                </Popconfirm>
              )}
              {rfi.status === "closed" && (
                <Button
                  type="default"
                  size="small"
                  onClick={() => handleStatusChange("open")}
                >
                  Reopen
                </Button>
              )}
              {(rfi.status === "open" || rfi.status === "answered") && (
                <Popconfirm
                  title="Void this RFI?"
                  description="This will mark the RFI as void."
                  onConfirm={() => handleStatusChange("void")}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger size="small">
                    Void RFI
                  </Button>
                </Popconfirm>
              )}
              {rfi.status === "void" && (
                <Button
                  type="default"
                  size="small"
                  onClick={() => handleStatusChange("open")}
                >
                  Reopen
                </Button>
              )}
            </Space>
          </div>
        }
        open={visible}
        onClose={onClose}
        width="100%"
        height="100vh"
        placement="right"
        closeIcon={<CloseOutlined style={{ fontSize: 18 }} />}
        bodyStyle={{
          paddingTop: 24,
          background: "#f5f5f5",
        }}
        headerStyle={{
          borderBottom: "1px solid #e8e8e8",
          padding: "20px 24px",
        }}
        footer={null}
        destroyOnClose
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "white",
            padding: "32px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Title level={4}>{rfi.title}</Title>

            <Descriptions
              column={2}
              bordered
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(rfi.status)}>{rfi.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={getPriorityColor(rfi.priority)}>{rfi.priority}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {rfi.created_by_first_name} {rfi.created_by_last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(rfi.created_at).format("MMM D, YYYY h:mm A")}
              </Descriptions.Item>
              <Descriptions.Item label="Age">
                <Space>
                  <Text>{rfi.days_open} days open</Text>
                  {rfi.days_overdue > 0 && (
                    <Tag color="error">{rfi.days_overdue} days overdue</Tag>
                  )}
                  {rfi.days_until_due !== null &&
                    rfi.days_until_due <= 3 &&
                    rfi.days_until_due >= 0 && (
                      <Tag color="warning">
                        Due in {rfi.days_until_due} days
                      </Tag>
                    )}
                </Space>
              </Descriptions.Item>
              {rfi.assigned_to_first_name && (
                <Descriptions.Item label="Assigned To">
                  {rfi.assigned_to_first_name} {rfi.assigned_to_last_name}
                </Descriptions.Item>
              )}
              {rfi.due_date && (
                <Descriptions.Item label="Due Date">
                  <span
                    style={{
                      color: rfi.days_overdue > 0 ? "#ff4d4f" : "inherit",
                      fontWeight: rfi.days_overdue > 0 ? 600 : 400,
                    }}
                  >
                    {dayjs(rfi.due_date).format("MMM D, YYYY")}
                  </span>
                </Descriptions.Item>
              )}
              {rfi.discipline && (
                <Descriptions.Item label="Discipline">
                  {rfi.discipline}
                </Descriptions.Item>
              )}
              {rfi.spec_section && (
                <Descriptions.Item label="Spec Section">
                  {rfi.spec_section}
                </Descriptions.Item>
              )}
              {rfi.location && (
                <Descriptions.Item label="Location" span={2}>
                  {rfi.location}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card
              title="Watchers"
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Text type="secondary">
                  {(rfi.watchers || []).length} watching
                </Text>
              }
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Select
                  showSearch
                  allowClear
                  placeholder="Add watcher"
                  value={watcherSelectValue}
                  loading={loadingUsers}
                  onChange={(value) => {
                    setWatcherSelectValue(value);
                    if (value) addWatcher(value);
                  }}
                  optionFilterProp="label"
                  options={(projectUsers || [])
                    .filter((u) => {
                      const watchers = rfi.watchers || [];
                      return !watchers.some((w) => w.user_id === u.id);
                    })
                    .map((u) => ({
                      value: u.id,
                      label: `${u.first_name} ${u.last_name}`.trim(),
                    }))}
                />

                <Space wrap>
                  {(rfi.watchers || []).length === 0 && (
                    <Text type="secondary">No watchers yet.</Text>
                  )}
                  {(rfi.watchers || []).map((watcher) => (
                    <Tag
                      key={watcher.user_id}
                      color="blue"
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        if (watcherBusyId) return;
                        removeWatcher(watcher.user_id);
                      }}
                    >
                      {watcher.first_name} {watcher.last_name}
                      {watcherBusyId === watcher.user_id ? "…" : ""}
                    </Tag>
                  ))}
                </Space>
              </Space>
            </Card>

            <Card title="Question" size="small" style={{ marginBottom: 16 }}>
              <Text>{rfi.question}</Text>
            </Card>

            <Card
              title={
                <Space>
                  <PaperClipOutlined />
                  Attachments ({rfi.attachments?.length || 0})
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => {
                    uploadAndAttach(file);
                    return false;
                  }}
                >
                  <Button
                    size="small"
                    loading={attaching}
                    icon={<PaperClipOutlined />}
                  >
                    Add File
                  </Button>
                </Upload>
              }
            >
              {rfi.attachments && rfi.attachments.length > 0 ? (
                <List
                  dataSource={rfi.attachments}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        (isImageFile(getMimeType(item)) ||
                          isPdfFile(getMimeType(item))) && (
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() =>
                              handlePreview(
                                item.file_id,
                                item.original_name,
                                getMimeType(item)
                              )
                            }
                          >
                            Preview
                          </Button>
                        ),
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() =>
                            handleDownloadFile(item.file_id, item.original_name)
                          }
                        >
                          Download
                        </Button>,
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar icon={getFileIcon(getMimeType(item))} />
                        }
                        title={item.original_name}
                        description={`${(item.size_bytes / 1024).toFixed(
                          1
                        )} KB • ${dayjs(item.attached_at).format(
                          "MMM D, YYYY"
                        )}${
                          uploadProgress[item.attachment_id]
                            ? ` • ${uploadProgress[item.attachment_id]}%`
                            : ""
                        }`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No attachments yet.</Text>
              )}
            </Card>

            <Card title="Activity" size="small" style={{ marginBottom: 16 }}>
              <List
                dataSource={auditLogs}
                locale={{ emptyText: "No activity yet." }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.action}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.created_at).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </Text>
                        </Space>
                      }
                      description={
                        <div
                          style={{ fontSize: 12, color: "var(--brand-muted)" }}
                        >
                          {item.field ? `Field: ${item.field}` : ""}
                          {item.first_name && (
                            <span>{` • By ${item.first_name} ${
                              item.last_name || ""
                            }`}</span>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            {rfi.responses && rfi.responses.length > 0 && (
              <Card
                title={`Responses (${rfi.responses.length})`}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <List
                  dataSource={rfi.responses}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar>
                            {item.responded_by_first_name?.[0] || "?"}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>
                              {item.responded_by_first_name}{" "}
                              {item.responded_by_last_name}
                            </Text>
                            {item.is_official && (
                              <Tag color="gold">Official</Tag>
                            )}
                            {!item.responded_by_first_name && (
                              <Tag color="blue">Email</Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.created_at).format(
                                "MMM D, YYYY h:mm A"
                              )}
                            </Text>
                          </Space>
                        }
                        description={
                          <div style={{ marginTop: 8 }}>
                            {item.response_text}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            <Card
              title={`Comments (${(rfi.comments || []).length})`}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <List
                dataSource={rfi.comments || []}
                locale={{ emptyText: "No comments yet." }}
                renderItem={(item) => (
                  <List.Item
                    actions={
                      canDeleteComment(item)
                        ? [
                            <Popconfirm
                              key="delete"
                              title="Delete this comment?"
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancel"
                              onConfirm={() => deleteComment(item.id)}
                            >
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                Delete
                              </Button>
                            </Popconfirm>,
                          ]
                        : []
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar>
                          {item.first_name?.[0] || item.email?.[0] || "?"}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>
                            {`${item.first_name || ""} ${
                              item.last_name || ""
                            }`.trim() || item.email}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.created_at).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </Text>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>{item.body}</div>
                      }
                    />
                  </List.Item>
                )}
              />

              <Divider style={{ margin: "12px 0" }} />
              <Space direction="vertical" style={{ width: "100%" }}>
                <TextArea
                  rows={3}
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={commenting}
                  onClick={addComment}
                >
                  Add Comment
                </Button>
              </Space>
            </Card>

            <Card title="Add Response" size="small">
              <TextArea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter your response..."
                style={{ marginBottom: 12 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleAddResponse}
                loading={responding}
                size="large"
              >
                Send Response
              </Button>
            </Card>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Button onClick={onClose} size="large">
                Close
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Image Preview Modal */}
      <Image
        width={0}
        style={{ display: "none" }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          src: previewImage,
          onVisibleChange: (visible) => {
            setPreviewVisible(visible);
            if (!visible) {
              window.URL.revokeObjectURL(previewImage);
            }
          },
        }}
      />
    </>
  );
};

export default RfiDetailModal;
