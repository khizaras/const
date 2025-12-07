import React, { useEffect } from "react";
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Row,
  Col,
  Segmented,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { setFilters, fetchRfis } from "../features/rfis/rfiSlice";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
  { value: "void", label: "Void" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const RfiFilters = () => {
  const dispatch = useDispatch();
  const { filters, meta } = useSelector((state) => state.rfis);

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      ...filters,
      dueBefore: filters.dueBefore ? dayjs(filters.dueBefore) : null,
    });
  }, [filters, form]);

  const handleFinish = (values) => {
    const payload = {
      ...values,
      dueBefore: values.dueBefore
        ? values.dueBefore.format("YYYY-MM-DD")
        : undefined,
    };
    dispatch(setFilters(payload));
    dispatch(fetchRfis());
  };

  const handleReset = () => {
    form.resetFields();
    dispatch(
      setFilters({
        status: undefined,
        priority: undefined,
        search: "",
        dueBefore: undefined,
      })
    );
    dispatch(fetchRfis());
  };

  const quickStatusValue = filters.status || "all";

  return (
    <Card className="panel-card filter-panel" bordered={false}>
      <div className="filter-panel__header">
        <div>
          <strong>Filter RFIs</strong>
          <br />
          <small>{meta.total} records synced from field + design teams</small>
        </div>
        <Button type="text" icon={<ReloadOutlined />} onClick={handleReset}>
          Reset
        </Button>
      </div>

      <Segmented
        block
        options={[{ label: "All", value: "all" }, ...statusOptions]}
        value={quickStatusValue}
        onChange={(value) => {
          const status = value === "all" ? undefined : value;
          form.setFieldsValue({ status });
          handleFinish({ ...form.getFieldsValue(), status });
        }}
        style={{ marginBottom: "1.25rem" }}
      />

      <Form
        layout="vertical"
        form={form}
        initialValues={filters}
        onFinish={handleFinish}
        className="filter-form"
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="priority" label="Priority">
              <Select
                options={[
                  { value: undefined, label: "All" },
                  ...priorityOptions,
                ]}
                allowClear
                placeholder="Any priority"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="dueBefore" label="Due Before">
              <DatePicker
                style={{ width: "100%" }}
                format="DD MMM YYYY"
                placeholder="Select date"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="search" label="Search Terms">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Title, question, spec, location"
              />
            </Form.Item>
          </Col>
        </Row>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Clear
          </Button>
          <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
            Apply Filters
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default RfiFilters;
