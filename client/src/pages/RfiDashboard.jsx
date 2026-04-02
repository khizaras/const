import React, { useEffect, useState } from "react";
import { Card, Progress, Tag, Button, Tooltip, Empty, message } from "antd";
import {
  PlusOutlined,
  ClockCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  WarningOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import RfiFilters from "../components/RfiFilters";
import RfiList from "../components/RfiList";
import RfiCreateModal from "../components/RfiCreateModal";
import { fetchRfis, fetchRfiMetrics } from "../features/rfis/rfiSlice";
import apiClient from "../services/apiClient";

const RfiDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, metrics } = useSelector((state) => state.rfis);
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const project = useSelector((state) => state.projects.activeProject);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    dispatch(fetchRfis());
    dispatch(fetchRfiMetrics());
  }, [dispatch, projectId]);

  const handleCreateSuccess = () => {
    if (!projectId) return;
    dispatch(fetchRfis());
    dispatch(fetchRfiMetrics());
  };

  const handleExportCSV = async () => {
    if (!projectId) return;
    try {
      const response = await apiClient.get(
        `/projects/${projectId}/rfis/export/csv`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `rfis_${projectId}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success("RFIs exported successfully");
    } catch (error) {
      message.error("Failed to export RFIs");
    }
  };

  // Calculate metrics
  const m = metrics.data;
  const openCount =
    m?.statusCounts?.open ??
    items.filter((rfi) => rfi.status === "open").length;
  const answeredCount =
    m?.statusCounts?.answered ??
    items.filter((rfi) => rfi.status === "answered").length;
  const closedCount =
    m?.statusCounts?.closed ??
    items.filter((rfi) => rfi.status === "closed").length;
  const urgentCount =
    m?.priorityCounts?.urgent ??
    items.filter((rfi) => rfi.priority === "urgent").length;
  const totalCount = m?.total ?? items.length;
  const overdueCount = m?.overdueOpen ?? 0;
  const answeredRate = totalCount
    ? Math.round((answeredCount / totalCount) * 100)
    : 0;
  const avgResponseHours = m?.avgFirstResponseHours
    ? Math.round(m.avgFirstResponseHours)
    : null;

  // At-risk RFIs (due within 5 days)
  const atRiskRfis = items
    .filter((rfi) => {
      if (!rfi.due_date || rfi.status === "closed") return false;
      const days = dayjs(rfi.due_date).diff(dayjs(), "day");
      return days <= 5 && days >= 0;
    })
    .slice(0, 5);

  // Overdue RFIs
  const overdueRfis = items
    .filter((rfi) => rfi.days_overdue > 0 && rfi.status !== "closed")
    .slice(0, 5);

  // No project selected state
  if (!projectId) {
    return (
      <div className="rfi-dashboard">
        <div className="empty-project-state">
          <InboxOutlined className="empty-icon" />
          <h2>No Project Selected</h2>
          <p>Select an active project to view and manage RFIs.</p>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/projects")}
          >
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rfi-dashboard">
      {/* Page Header */}
      <header className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">
            <FileTextOutlined className="page-title-icon" />
            RFI Dashboard
          </h1>
          <span className="page-subtitle">
            {project?.name || `Project #${projectId}`}
          </span>
        </div>
        <div className="page-header__right">
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            style={{ marginRight: "12px" }}
          >
            Export CSV
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            className="btn-create"
          >
            New RFI
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-box stat-box--open">
          <div className="stat-box__icon">
            <ClockCircleOutlined />
          </div>
          <div className="stat-box__data">
            <span className="stat-box__value">{openCount}</span>
            <span className="stat-box__label">Open</span>
          </div>
        </div>

        <div className="stat-box stat-box--answered">
          <div className="stat-box__icon">
            <CheckCircleOutlined />
          </div>
          <div className="stat-box__data">
            <span className="stat-box__value">{answeredCount}</span>
            <span className="stat-box__label">Answered</span>
          </div>
        </div>

        <div className="stat-box stat-box--closed">
          <div className="stat-box__icon">
            <CheckCircleOutlined />
          </div>
          <div className="stat-box__data">
            <span className="stat-box__value">{closedCount}</span>
            <span className="stat-box__label">Closed</span>
          </div>
        </div>

        <div className="stat-box stat-box--urgent">
          <div className="stat-box__icon">
            <FireOutlined />
          </div>
          <div className="stat-box__data">
            <span className="stat-box__value">{urgentCount}</span>
            <span className="stat-box__label">Urgent</span>
          </div>
        </div>

        <div className="stat-box stat-box--overdue">
          <div className="stat-box__icon">
            <WarningOutlined />
          </div>
          <div className="stat-box__data">
            <span className="stat-box__value">{overdueCount}</span>
            <span className="stat-box__label">Overdue</span>
          </div>
        </div>

        <div className="stat-box stat-box--total">
          <div className="stat-box__icon">
            <FileTextOutlined />
          </div>
          <div className="stat-box__data">
            <span className="stat-box__value">{totalCount}</span>
            <span className="stat-box__label">Total</span>
          </div>
        </div>
      </div>

      {/* Progress & Insights Row */}
      <div className="insights-row">
        <Card className="insight-card" bordered={false}>
          <div className="insight-card__header">
            <ThunderboltOutlined className="insight-icon" />
            <span>Response Rate</span>
          </div>
          <div className="insight-card__body">
            <div className="progress-ring">
              <Progress
                type="circle"
                percent={answeredRate}
                size={100}
                strokeColor={{
                  "0%": "#1e3a5f",
                  "100%": "#0ea5e9",
                }}
                format={(percent) => (
                  <span className="progress-value">{percent}%</span>
                )}
              />
            </div>
            <div className="progress-meta">
              <span className="progress-label">Answered / Total</span>
              <span className="progress-detail">
                {answeredCount} of {totalCount} RFIs
              </span>
            </div>
          </div>
        </Card>

        <Card className="insight-card" bordered={false}>
          <div className="insight-card__header">
            <ClockCircleOutlined className="insight-icon" />
            <span>Avg Response Time</span>
          </div>
          <div className="insight-card__body insight-card__body--centered">
            <div className="big-stat">
              <span className="big-stat__value">{avgResponseHours ?? "—"}</span>
              <span className="big-stat__unit">hours</span>
            </div>
            <span className="big-stat__label">to first response</span>
          </div>
        </Card>

        <Card className="insight-card insight-card--warning" bordered={false}>
          <div className="insight-card__header">
            <WarningOutlined className="insight-icon" />
            <span>At Risk</span>
            <Tag color="orange" className="insight-tag">
              {atRiskRfis.length}
            </Tag>
          </div>
          <div className="insight-card__body">
            {atRiskRfis.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No at-risk RFIs"
              />
            ) : (
              <ul className="risk-list">
                {atRiskRfis.map((rfi) => (
                  <li key={rfi.id} className="risk-list__item">
                    <span className="risk-rfi-number">RFI-{rfi.number}</span>
                    <span className="risk-rfi-title">{rfi.title}</span>
                    <Tooltip
                      title={`Due ${dayjs(rfi.due_date).format("MMM D")}`}
                    >
                      <span className="risk-due">
                        <CalendarOutlined />{" "}
                        {dayjs(rfi.due_date).diff(dayjs(), "day")}d
                      </span>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="insight-card insight-card--danger" bordered={false}>
          <div className="insight-card__header">
            <ExclamationCircleOutlined className="insight-icon" />
            <span>Overdue</span>
            <Tag color="red" className="insight-tag">
              {overdueRfis.length}
            </Tag>
          </div>
          <div className="insight-card__body">
            {overdueRfis.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No overdue RFIs"
              />
            ) : (
              <ul className="risk-list">
                {overdueRfis.map((rfi) => (
                  <li
                    key={rfi.id}
                    className="risk-list__item risk-list__item--overdue"
                  >
                    <span className="risk-rfi-number">RFI-{rfi.number}</span>
                    <span className="risk-rfi-title">{rfi.title}</span>
                    <span className="risk-overdue">
                      <WarningOutlined /> {rfi.days_overdue}d late
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <RfiFilters />

      {/* RFI Table */}
      <RfiList />

      {/* Create Modal */}
      <RfiCreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default RfiDashboard;
