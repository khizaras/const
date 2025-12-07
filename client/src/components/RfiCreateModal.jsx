import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Upload,
  message,
  Space,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createRfi } from "../features/rfis/rfiSlice";
import apiClient from "../services/apiClient";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

const RfiCreateModal = ({ visible, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const projectId = useSelector((state) => state.rfis.projectId);

  // Fetch project users when modal opens
  useEffect(() => {
    if (visible && projectId) {
      loadProjectUsers();
    }
  }, [visible, projectId]);

  const loadProjectUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiClient.get(`/projects/${projectId}/users`);
      setProjectUsers(response.data.data || []);
    } catch (error) {
      console.error("Failed to load project users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Create RFI first
      const rfiData = {
        title: values.title,
        question: values.question,
        priority: values.priority,
        discipline: values.discipline || null,
        specSection: values.specSection || null,
        location: values.location || null,
        dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : null,
        assignedToUserId: values.assignedToUserId || null,
      };

      const result = await dispatch(createRfi(rfiData)).unwrap();
      const rfiId = result.id;

      // Upload files if any
      if (fileList.length > 0) {
        for (const file of fileList) {
          const fileToUpload = file.originFileObj || file;

          // Upload file first
          const formData = new FormData();
          formData.append("file", fileToUpload);

          const uploadResponse = await apiClient.post(
            `/projects/${projectId}/files`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          console.log("Upload response:", uploadResponse.data);
          const fileId = uploadResponse.data?.id || uploadResponse.data;

          if (!fileId) {
            console.error("No file ID in response:", uploadResponse.data);
            throw new Error("File upload failed - no file ID returned");
          }

          // Attach file to RFI
          await apiClient.post(
            `/projects/${projectId}/rfis/${rfiId}/attachments`,
            {
              fileId: typeof fileId === "object" ? fileId.id : fileId,
            }
          );
        }
      }

      message.success("RFI created successfully");
      form.resetFields();
      setFileList([]);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      message.error(error.message || "Failed to create RFI");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false; // Prevent auto upload
    },
    fileList,
    multiple: true,
  };

  return (
    <Modal
      title="Create New RFI"
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: "medium",
        }}
      >
        <Form.Item
          label="RFI Title"
          name="title"
          rules={[{ required: true, message: "Please enter RFI title" }]}
        >
          <Input placeholder="Brief summary of the request" />
        </Form.Item>

        <Form.Item
          label="Question / Description"
          name="question"
          rules={[{ required: true, message: "Please enter RFI question" }]}
        >
          <TextArea
            rows={4}
            placeholder="Detailed description of the information requested"
          />
        </Form.Item>

        <Space style={{ width: "100%", marginBottom: 16 }} size="large">
          <Form.Item
            label="Priority"
            name="priority"
            style={{ marginBottom: 0, minWidth: 150 }}
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Due Date"
            name="dueDate"
            style={{ marginBottom: 0, minWidth: 200 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
        </Space>

        <Space style={{ width: "100%", marginBottom: 16 }} size="large">
          <Form.Item
            label="Discipline"
            name="discipline"
            style={{ marginBottom: 0, minWidth: 150 }}
          >
            <Select placeholder="Select discipline" allowClear>
              <Option value="Architecture">Architecture</Option>
              <Option value="Structural">Structural</Option>
              <Option value="MEP">MEP</Option>
              <Option value="Civil">Civil</Option>
              <Option value="Landscape">Landscape</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Spec Section"
            name="specSection"
            style={{ marginBottom: 0, minWidth: 150 }}
          >
            <Input placeholder="e.g., 03300" />
          </Form.Item>
        </Space>

        <Space style={{ width: "100%", marginBottom: 16 }} size="large">
          <Form.Item
            label="Location"
            name="location"
            style={{ marginBottom: 0, flex: 1 }}
          >
            <Input placeholder="Building, floor, or area" />
          </Form.Item>

          <Form.Item
            label="Assign To"
            name="assignedToUserId"
            style={{ marginBottom: 0, minWidth: 200 }}
          >
            <Select
              placeholder="Select user"
              allowClear
              loading={loadingUsers}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {projectUsers.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Space>

        <Form.Item label="Attachments">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select Files</Button>
          </Upload>
          <div
            style={{ color: "var(--brand-muted)", fontSize: 12, marginTop: 8 }}
          >
            Supported: Images, PDFs, DWG, Office docs (Max 50MB)
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              <PlusOutlined /> Create RFI
            </Button>
            <Button onClick={handleCancel} size="large">
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RfiCreateModal;
