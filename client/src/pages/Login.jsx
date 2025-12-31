import React, { useEffect } from "react";
import { Card, Typography, Form, Input, Button, message } from "antd";
import {
  ThunderboltOutlined,
  MailOutlined,
  LockOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../features/auth/authSlice";

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth.status);
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  const handleFinish = async (values) => {
    try {
      await dispatch(loginUser(values)).unwrap();
      message.success("Welcome back");
    } catch (err) {
      message.error(err.message || "Unable to login");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <ThunderboltOutlined />
          </div>
          <Title level={3} className="login-title">
            Procore Console
          </Title>
          <Text className="login-subtitle">
            Enterprise RFI Management Platform
          </Text>
        </div>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Organization ID"
            name="organizationId"
            rules={[{ required: true, message: "Enter org ID" }]}
            initialValue={1}
          >
            <Input
              type="number"
              min={1}
              prefix={
                <BankOutlined style={{ color: "var(--text-tertiary)" }} />
              }
              placeholder="Enter organization ID"
            />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, type: "email", message: "Enter valid email" },
            ]}
          >
            <Input
              prefix={
                <MailOutlined style={{ color: "var(--text-tertiary)" }} />
              }
              placeholder="you@company.com"
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Enter password" }]}
          >
            <Input.Password
              prefix={
                <LockOutlined style={{ color: "var(--text-tertiary)" }} />
              }
              placeholder="Enter your password"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={status === "loading"}
            className="login-btn"
          >
            Sign In
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Login;
