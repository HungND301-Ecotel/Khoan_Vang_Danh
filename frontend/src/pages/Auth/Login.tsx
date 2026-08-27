import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import api from "../../config/api.config";
import { useAtom } from "jotai";
import { userAtom } from "../../atoms/userAtoms";
import { showErrorAlert } from "../../components/Alert";

const loginValidationSchema = yup.object({
  username: yup.string().required("Vui lòng nhập tên đăng nhập"),
  password: yup.string().required("Vui lòng nhập mật khẩu"),
});

const Login = () => {
  const navigate = useNavigate();
  const [, setUser] = useAtom(userAtom);
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };
  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      api.post("/auths/login", credentials).then((res) => res.data),
    onSuccess: (data) => {
      localStorage.setItem("token", data.data.token);
      if (data.data.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }
      setUser(data.data.user);
      navigate("/");
    },
    onError: (error: any) => {
      showErrorAlert(
        error.response.data.message || error.message || "Đăng nhập thất bại",
      );
    },
  });

  const loginFormik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: (values) => {
      loginMutation.mutate(values);
    },
  });

  return (
    <Box
      sx={{
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          background: "#035bb4ff",
          color: "white",
          py: { xs: 1.5, md: 2 },
          px: 3,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: {
                  xl: 36,
                  lg: 28,
                  md: 24,
                  sm: 20,
                  xs: 16,
                },
                letterSpacing: 1,
              }}
              textAlign="center"
            >
              KHOÁN CHI PHÍ VÀNG DANH
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Background container filling full remaining height without scroll */}
      <Box
        sx={{
          flex: 1,
          backgroundImage: 'url("/image/background.jpg")',
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          p: 2,
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 4 },
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 3,
              bgcolor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(4px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: 150,
                height: "auto",
                maxHeight: 120,
                objectFit: "contain",
                marginBottom: 8,
              }}
            />
            <Typography
              component="h1"
              variant="h5"
              align="center"
              sx={{ fontWeight: 600, color: "#1e293b", mb: 0.5 }}
            >
              Đăng nhập
            </Typography>
            <Box
              component="form"
              onSubmit={loginFormik.handleSubmit}
              sx={{ width: "100%", mt: 1 }}
            >
              <TextField
                margin="normal"
                fullWidth
                size="small"
                id="username"
                name="username"
                label="Tên đăng nhập"
                value={loginFormik.values.username}
                onChange={loginFormik.handleChange}
                error={
                  loginFormik.touched.username &&
                  Boolean(loginFormik.errors.username)
                }
                helperText={
                  loginFormik.touched.username && loginFormik.errors.username
                }
              />
              <TextField
                margin="normal"
                fullWidth
                size="small"
                id="password"
                name="password"
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                value={loginFormik.values.password}
                onChange={loginFormik.handleChange}
                error={
                  loginFormik.touched.password &&
                  Boolean(loginFormik.errors.password)
                }
                helperText={
                  loginFormik.touched.password && loginFormik.errors.password
                }
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 2.5,
                  mb: 1,
                  py: 1.2,
                  fontWeight: 600,
                  fontSize: 15,
                  borderRadius: 2,
                  bgcolor: "#035bb4ff",
                  "&:hover": { bgcolor: "#024a94" },
                }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
              </Button>
            </Box>
          </Paper>
        </Container>

        <Typography
          sx={{
            position: "absolute",
            bottom: 10,
            left: 16,
            color: "white",
            fontSize: 12,
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            userSelect: "none",
          }}
        >
          khoanchiphivangdanh - Version: 27/08/2026 - release_1.0.1
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
