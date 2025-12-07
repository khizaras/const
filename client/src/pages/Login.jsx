import React, { useEffect } from "react";
import { Card, Typography, Form, Input, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../features/auth/authSlice";

const { Title } = Typography;

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: 400 }}>
        <Title level={3}>Project Console</Title>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Organization ID"
            name="organizationId"
            rules={[{ required: true, message: "Enter org ID" }]}
            initialValue={1}
          >
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={status === "loading"}
          >
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
