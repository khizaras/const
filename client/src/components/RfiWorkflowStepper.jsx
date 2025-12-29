import React, { useEffect, useState } from "react";
import { Steps, Button, Space, Popconfirm, Tag } from "antd";
import apiClient from "../services/apiClient";

const TRANSITIONS = {
  open: ["in_review", "answered", "void"],
  in_review: ["answered", "open", "void"],
  answered: ["closed", "open", "void"],
  closed: ["open"],
  void: ["open"],
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
    <div style={{ marginBottom: 24 }}>
      <Steps
        current={currentIndex >= 0 ? currentIndex : 0}
        size="small"
        items={workflow.map((step) => ({
          title: step.label,
          status:
            step.key === currentStatus
              ? "process"
              : workflow.findIndex((s) => s.key === step.key) < currentIndex
              ? "finish"
              : "wait",
        }))}
      />
      <Space style={{ marginTop: 16 }} wrap>
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
              <Button
                size="small"
                type={isDanger ? "default" : "primary"}
                danger={isDanger}
                loading={loading}
              >
                {label}
              </Button>
            </Popconfirm>
          );
        })}
      </Space>
    </div>
  );
};

export default RfiWorkflowStepper;
