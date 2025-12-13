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
  const projectId = useSelector((state) => state.rfis.projectId);

  useEffect(() => {
    if (visible && rfiId) {
      loadRfiDetail();
    }
  }, [visible, rfiId]);

  const loadRfiDetail = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/projects/${projectId}/rfis/${rfiId}`
      );
      setRfi(response.data);
    } catch (error) {
      message.error("Failed to load RFI details");
    } finally {
      setLoading(false);
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

  const isImageFile = (mimetype) => {
    return mimetype && mimetype.startsWith("image/");
  };

  const isPdfFile = (mimetype) => {
    return mimetype === "application/pdf";
  };

  const handlePreview = async (fileId, filename, mimetype) => {
    if (isImageFile(mimetype)) {
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
    } else if (isPdfFile(mimetype)) {
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

            {rfi.watchers && rfi.watchers.length > 0 && (
              <Card
                title="Watchers"
                size="small"
                style={{ marginBottom: 16 }}
                extra={
                  <Text type="secondary">{rfi.watchers.length} watching</Text>
                }
              >
                <Space wrap>
                  {rfi.watchers.map((watcher) => (
                    <Tag key={watcher.user_id} color="blue">
                      {watcher.first_name} {watcher.last_name}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            <Card title="Question" size="small" style={{ marginBottom: 16 }}>
              <Text>{rfi.question}</Text>
            </Card>

            {rfi.attachments && rfi.attachments.length > 0 && (
              <Card
                title={
                  <Space>
                    <PaperClipOutlined />
                    Attachments ({rfi.attachments.length})
                  </Space>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <List
                  dataSource={rfi.attachments}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        (isImageFile(item.mimetype) ||
                          isPdfFile(item.mimetype)) && (
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() =>
                              handlePreview(
                                item.file_id,
                                item.original_name,
                                item.mimetype
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
                        avatar={<Avatar icon={getFileIcon(item.mimetype)} />}
                        title={item.original_name}
                        description={`${(item.size_bytes / 1024).toFixed(
                          1
                        )} KB • ${dayjs(item.attached_at).format(
                          "MMM D, YYYY"
                        )}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

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
