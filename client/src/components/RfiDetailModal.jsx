import React, { useState, useEffect } from "react";
import {
  Modal,
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
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  SendOutlined,
  FileOutlined,
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
      <Modal
        title="RFI Details"
        open={visible}
        onCancel={onClose}
        width={900}
        loading={loading}
        footer={null}
      >
        Loading...
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <span>RFI-{rfi.number}</span>
          <Tag color={getStatusColor(rfi.status)}>{rfi.status}</Tag>
          <Tag color={getPriorityColor(rfi.priority)}>{rfi.priority}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={
        <Button onClick={onClose} size="large">
          Close
        </Button>
      }
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
          {rfi.assigned_to_first_name && (
            <Descriptions.Item label="Assigned To">
              {rfi.assigned_to_first_name} {rfi.assigned_to_last_name}
            </Descriptions.Item>
          )}
          {rfi.due_date && (
            <Descriptions.Item label="Due Date">
              {dayjs(rfi.due_date).format("MMM D, YYYY")}
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
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() =>
                        handleDownloadFile(item.file_id, item.original_name)
                      }
                    >
                      Download
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileOutlined />} />}
                    title={item.original_name}
                    description={`${(item.size_bytes / 1024).toFixed(
                      1
                    )} KB • ${dayjs(item.attached_at).format("MMM D, YYYY")}`}
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
                        {item.is_official && <Tag color="gold">Official</Tag>}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.created_at).format("MMM D, YYYY h:mm A")}
                        </Text>
                      </Space>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>{item.response_text}</div>
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
          >
            Send Response
          </Button>
        </Card>
      </div>
    </Modal>
  );
};

export default RfiDetailModal;
