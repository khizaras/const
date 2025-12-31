import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Empty,
  Spin,
  Button,
} from "antd";
import {
  FileTextOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import apiClient from "../services/apiClient";

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const projectId = useSelector((state) => state.projects.activeProjectId);
  const project = useSelector((state) => state.projects.activeProject);
  const [loading, setLoading] = useState(false);
  const [rfiMetrics, setRfiMetrics] = useState({});
  const [issueStats, setIssueStats] = useState({});
  const [dailyLogStats, setDailyLogStats] = useState({});

  useEffect(() => {
    if (!projectId) return;
    loadReports();
  }, [projectId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Load RFI metrics
      const rfiRes = await apiClient.get(`/projects/${projectId}/rfis/metrics`);
      setRfiMetrics(rfiRes.data.data || {});

      // Load Issues stats
      const issuesRes = await apiClient.get(`/projects/${projectId}/issues`);
      const issues = issuesRes.data.data || [];
      const issuesByStatus = issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {});
      const overdue = issues.filter(
        (i) => i.days_overdue > 0 && i.status !== "closed"
      ).length;
      setIssueStats({
        total: issues.length,
        open: issuesByStatus.open || 0,
        in_progress: issuesByStatus.in_progress || 0,
        closed: issuesByStatus.closed || 0,
        overdue,
      });

      // Load Daily Logs stats
      const logsRes = await apiClient.get(`/projects/${projectId}/daily-logs`);
      const logs = logsRes.data.data || [];
      const logsByStatus = logs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {});
      setDailyLogStats({
        total: logs.length,
        draft: logsByStatus.draft || 0,
        submitted: logsByStatus.submitted || 0,
      });
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="page-container">
        <Card>
          <Empty
            description="No project selected"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate("/projects")}>
              Select Project
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  // Calculate RFI metrics
  const rfiTotal = rfiMetrics.total || 0;
  const rfiOpen = rfiMetrics.statusCounts?.open || 0;
  const rfiAnswered = rfiMetrics.statusCounts?.answered || 0;
  const rfiClosed = rfiMetrics.statusCounts?.closed || 0;
  const rfiOverdue = rfiMetrics.overdueOpen || 0;
  const rfiAnswerRate = rfiTotal
    ? Math.round((rfiAnswered / rfiTotal) * 100)
    : 0;
  const avgResponseHours = rfiMetrics.avgFirstResponseHours
    ? Math.round(rfiMetrics.avgFirstResponseHours)
    : 0;

  // Calculate issue closure rate
  const issueTotal = issueStats.total || 0;
  const issueClosed = issueStats.closed || 0;
  const issueClosureRate = issueTotal
    ? Math.round((issueClosed / issueTotal) * 100)
    : 0;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">
            <TrophyOutlined className="page-title-icon" />
            Project Reports
          </h1>
          <span className="page-subtitle">
            {project?.name || `Project #${projectId}`}
          </span>
        </div>
      </header>

      <Spin spinning={loading}>
        {/* Project Health Overview */}
        <Card
          title="Project Health"
          style={{ marginBottom: 24 }}
          className="panel-card"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="RFI Answer Rate"
                value={rfiAnswerRate}
                suffix="%"
                prefix={<FileTextOutlined />}
                valueStyle={{ color: rfiAnswerRate >= 80 ? "#52c41a" : "#faad14" }}
              />
              <Progress
                percent={rfiAnswerRate}
                strokeColor={rfiAnswerRate >= 80 ? "#52c41a" : "#faad14"}
                showInfo={false}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Issue Closure Rate"
                value={issueClosureRate}
                suffix="%"
                prefix={<CheckSquareOutlined />}
                valueStyle={{
                  color: issueClosureRate >= 80 ? "#52c41a" : "#faad14",
                }}
              />
              <Progress
                percent={issueClosureRate}
                strokeColor={issueClosureRate >= 80 ? "#52c41a" : "#faad14"}
                showInfo={false}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Overdue RFIs"
                value={rfiOverdue}
                prefix={<WarningOutlined />}
                valueStyle={{ color: rfiOverdue > 0 ? "#ff4d4f" : "#52c41a" }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Avg. Response Time"
                value={avgResponseHours}
                suffix="hrs"
                prefix={<ClockCircleOutlined />}
                valueStyle={{
                  color: avgResponseHours <= 48 ? "#52c41a" : "#faad14",
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* RFI Summary */}
        <Card title="RFI Summary" style={{ marginBottom: 24 }} className="panel-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Total RFIs" value={rfiTotal} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Open"
                  value={rfiOpen}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Answered"
                  value={rfiAnswered}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Closed"
                  value={rfiClosed}
                  valueStyle={{ color: "#8c8c8c" }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Issue Summary */}
        <Card title="Issue Summary" style={{ marginBottom: 24 }} className="panel-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Total Issues" value={issueTotal} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Open"
                  value={issueStats.open}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="In Progress"
                  value={issueStats.in_progress}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Closed"
                  value={issueClosed}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Daily Logs Summary */}
        <Card title="Daily Logs Summary" className="panel-card">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="Total Logs" value={dailyLogStats.total} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Drafts"
                  value={dailyLogStats.draft}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Submitted"
                  value={dailyLogStats.submitted}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default ReportsDashboard;
