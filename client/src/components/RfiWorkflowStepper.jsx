import React, { useEffect, useState } from "react";
import { Steps, Button, Space, Popconfirm, Tag, Tooltip, Badge } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  StopOutlined,
  RightOutlined,
} from "@ant-design/icons";
import apiClient from "../services/apiClient";

const TRANSITIONS = {
  open: ["in_review", "answered", "void"],
  in_review: ["answered", "open", "void"],
  answered: ["closed", "open", "void"],
  closed: ["open"],
  void: ["open"],
};

const STATUS_ICONS = {
  open: <ClockCircleOutlined />,
  in_review: <SyncOutlined spin />,
  answered: <CheckCircleOutlined />,
  closed: <CheckCircleOutlined />,
  void: <StopOutlined />,
};

const RfiWorkflowStepper = ({
  projectId,
  rfiId,
  currentStatus,
  onStatusChange,
}) => {
  const [workflow, setWorkflow] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get(
          `/projects/${projectId}/rfis/workflow`
        );
        setWorkflow(data?.workflow || []);
      } catch (err) {
        console.error("Failed to load workflow", err);
      }
    };
    if (projectId) load();
  }, [projectId]);

  const currentIndex = workflow.findIndex((s) => s.key === currentStatus);
  const allowed = TRANSITIONS[currentStatus] || [];

  const handleTransition = async (nextStatus) => {
    setLoading(true);
    try {
      await apiClient.patch(`/projects/${projectId}/rfis/${rfiId}`, {
        status: nextStatus,
      });
      onStatusChange && onStatusChange(nextStatus);
    } catch (err) {
      console.error("Status change failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!workflow.length) return null;

  return (
    <div className="workflow-stepper">
      <div className="workflow-stepper__header">
        <Badge status="processing" />
        <span className="workflow-stepper__title">Workflow Status</span>
      </div>
      <Steps
        current={currentIndex >= 0 ? currentIndex : 0}
        size="small"
        className="workflow-steps"
        items={workflow.map((step) => ({
          title: step.label,
          icon: STATUS_ICONS[step.key],
          status:
            step.key === currentStatus
              ? "process"
              : workflow.findIndex((s) => s.key === step.key) < currentIndex
              ? "finish"
              : "wait",
        }))}
      />
      <div className="workflow-stepper__actions">
        <span className="workflow-stepper__actions-label">
          Available Transitions:
        </span>
        <Space wrap>
          {allowed.map((nextStatus) => {
            const stepInfo = workflow.find((s) => s.key === nextStatus);
            const label = stepInfo?.label || nextStatus;
            const isDanger = nextStatus === "void";
            return (
              <Popconfirm
                key={nextStatus}
                title={`Transition to ${label}?`}
                onConfirm={() => handleTransition(nextStatus)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title={`Move to ${label} status`}>
                  <Button
                    size="small"
                    type={isDanger ? "default" : "primary"}
                    danger={isDanger}
                    loading={loading}
                    icon={<RightOutlined />}
                    className={`workflow-btn ${
                      isDanger ? "workflow-btn--danger" : ""
                    }`}
                  >
                    {label}
                  </Button>
                </Tooltip>
              </Popconfirm>
            );
          })}
        </Space>
      </div>
    </div>
  );
};

export default RfiWorkflowStepper;
