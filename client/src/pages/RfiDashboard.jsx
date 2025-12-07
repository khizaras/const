import React, { useEffect, useState } from "react";
import { Row, Col, Statistic, Card, Progress, List, Tag, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import RfiFilters from "../components/RfiFilters";
import RfiList from "../components/RfiList";
import RfiCreateModal from "../components/RfiCreateModal";
import { fetchRfis } from "../features/rfis/rfiSlice";

const RfiDashboard = () => {
  const dispatch = useDispatch();
  const { items, projectId } = useSelector((state) => state.rfis);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchRfis());
  }, [dispatch]);

  const handleCreateSuccess = () => {
    dispatch(fetchRfis());
  };

  const openCount = items.filter((rfi) => rfi.status === "open").length;
  const answeredCount = items.filter((rfi) => rfi.status === "answered").length;
  const closedCount = items.filter((rfi) => rfi.status === "closed").length;
  const urgentCount = items.filter((rfi) => rfi.priority === "urgent").length;
  const answeredRate = items.length
    ? Math.round((answeredCount / items.length) * 100)
    : 0;

  const cycleDurations = items
    .filter((rfi) => rfi.created_at && rfi.updated_at)
    .map((rfi) =>
      Math.max(1, dayjs(rfi.updated_at).diff(dayjs(rfi.created_at), "day"))
    );
  const avgCycle = cycleDurations.length
    ? Math.round(
        cycleDurations.reduce((acc, value) => acc + value, 0) /
          cycleDurations.length
      )
    : 0;

  const dueSoon = items
    .filter((rfi) => {
      if (!rfi.due_date) return false;
      const days = dayjs(rfi.due_date).diff(dayjs(), "day");
      return days <= 5 && rfi.status !== "closed";
    })
    .slice(0, 4);

  const recentActivity = items.slice(0, 4);

  const heroSignals = [
    { label: "Live Issue Feed", value: `${dueSoon.length || 0} alerts` },
    { label: "Ball-in-Court SLA", value: `${openCount || 0} owners` },
    {
      label: "Design + Field Sync",
      value: `${recentActivity.length || 0} updates`,
    },
  ];

  const heroMetrics = [
    {
      label: "Open RFIs",
      value: openCount,
      caption: "Active queue",
    },
    {
      label: "Answered Rate",
      value: `${answeredRate}%`,
      caption: "This week",
    },
    {
      label: "Avg Cycle (days)",
      value: avgCycle || "—",
      caption: "Close-out pace",
    },
    {
      label: "Urgent Queue",
      value: urgentCount,
      caption: "Needs <24h",
    },
  ];

  return (
    <div>
      <div className="hero-grid">
        <section className="hero-grid__primary">
          <p className="hero-grid__eyebrow">
            Live RFI Signal · North River Terminal · Core Shell
          </p>
          <h2 className="hero-grid__title">
            Precision workflow for project clarity.
          </h2>
          <p className="hero-grid__lead">
            Track every clarification, ball-in-court handoff, and urgent design
            decision inside a single command surface built for operations and
            field teams.
          </p>
          <div className="hero-cta-row">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Create RFI
            </Button>
            <span className="hero-chip hero-chip--badge">
              Package #{projectId || "—"}
            </span>
            <span className="hero-chip hero-chip--badge">
              Ops + Field Alignment
            </span>
            <span className="hero-chip hero-chip--alert">
              {urgentCount} urgent
            </span>
          </div>
          <div className="hero-metric-grid">
            {heroMetrics.map((metric) => (
              <div className="metric-tile" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.caption}</small>
              </div>
            ))}
          </div>
        </section>
        <aside className="hero-grid__secondary">
          <Card className="hero-insight-card" bordered={false}>
            <div className="hero-insight-card__tabs">
              <span className="insight-tab insight-tab--active">
                Live Signal
              </span>
              <span className="insight-tab">Ball-in-Court</span>
              <span className="insight-tab">Design Sync</span>
            </div>
            <div className="hero-card__section">
              <Statistic
                title="Answer Confidence"
                value={answeredRate}
                suffix="%"
              />
              <Statistic
                title="Avg Cycle"
                value={avgCycle || 0}
                suffix=" days"
              />
            </div>
            <div className="hero-progress">
              <Progress
                percent={answeredRate}
                showInfo={false}
                strokeColor="#2563eb"
              />
              <div className="hero-progress__meta">
                <span>Goal 85%</span>
                <span>{answeredRate}%</span>
              </div>
            </div>
            <div className="hero-feed">
              {heroSignals.map((signal) => (
                <div className="hero-feed__item" key={signal.label}>
                  <span className="hero-feed__label">{signal.label}</span>
                  <span className="hero-feed__value">{signal.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <div className="stat-grid">
        <div className="stat-grid__item">
          <div className="stat-grid__label">Total Active</div>
          <div className="stat-grid__value">{items.length}</div>
          <small style={{ color: "var(--brand-muted)" }}>
            Includes open + answered pending close
          </small>
        </div>
        <div className="stat-grid__item">
          <div className="stat-grid__label">Answered</div>
          <div className="stat-grid__value">{answeredCount}</div>
          <small style={{ color: "var(--brand-muted)" }}>
            Awaiting close-out confirmation
          </small>
        </div>
        <div className="stat-grid__item">
          <div className="stat-grid__label">Closed</div>
          <div className="stat-grid__value">{closedCount}</div>
          <small style={{ color: "var(--brand-muted)" }}>
            Fully resolved and archived
          </small>
        </div>
        <div className="stat-grid__item">
          <div className="stat-grid__label">Urgent</div>
          <div className="stat-grid__value">{urgentCount}</div>
          <small style={{ color: "var(--brand-muted)" }}>
            Requires response in &lt;24 hrs
          </small>
        </div>
      </div>

      <RfiFilters />

      <Row gutter={24} wrap>
        <Col xs={24} lg={16} style={{ marginBottom: "1.5rem" }}>
          <RfiList />
        </Col>
        <Col
          xs={24}
          lg={8}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <Card
            className="panel-card"
            title="At-Risk Deadlines"
            extra={<Tag color="red">Due &lt; 5 days</Tag>}
            bordered={false}
          >
            <List
              className="at-risk-list"
              dataSource={dueSoon}
              locale={{ emptyText: "No upcoming risk windows" }}
              renderItem={(rfi) => (
                <List.Item>
                  <List.Item.Meta
                    title={`RFI-${rfi.number} · ${rfi.title}`}
                    description={
                      <div className="rfi-detail-meta">
                        <span>Due {dayjs(rfi.due_date).format("DD MMM")}</span>
                        <span>
                          Ball in court: {rfi.ball_in_court_first_name}
                        </span>
                      </div>
                    }
                  />
                  <Tag color="volcano">{rfi.priority}</Tag>
                </List.Item>
              )}
            />
          </Card>

          <Card
            className="panel-card"
            title="Recent Activity"
            extra={<Tag color="geekblue">Chronology</Tag>}
            bordered={false}
          >
            <List
              dataSource={recentActivity}
              locale={{ emptyText: "No RFIs loaded" }}
              renderItem={(rfi) => (
                <List.Item>
                  <List.Item.Meta
                    title={rfi.title}
                    description={`Updated ${dayjs(rfi.updated_at).format(
                      "DD MMM, HH:mm"
                    )}`}
                  />
                  <span
                    className={`status-pill status-pill--${
                      rfi.status || "open"
                    }`}
                  >
                    {rfi.status}
                  </span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <RfiCreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default RfiDashboard;
