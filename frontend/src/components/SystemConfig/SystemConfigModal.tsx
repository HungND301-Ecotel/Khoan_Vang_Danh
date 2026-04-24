import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  InputAdornment,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  InfoOutlined,
  SaveOutlined,
  Close as CloseIcon,
  TranslateOutlined,
} from "@mui/icons-material";
import { useAtom } from "jotai";
import {
  systemConfigsAtom,
  SystemConfigType,
} from "../../atoms/systemConfigAtoms";
import api from "../../config/api.config";
import BaseModal from "../Common/BaseModal";

interface SystemConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SystemConfigModal({
  open,
  onClose,
}: SystemConfigModalProps) {
  const [configs, setConfigs] = useAtom(systemConfigsAtom);
  const [tempConfigs, setTempConfigs] = useState<SystemConfigType[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTempConfigs([...configs]);
    }
  }, [open, configs]);

  const handleChangeValue = (key: string, value: string) => {
    setTempConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c)),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const changedConfigs = tempConfigs.filter(
        (tc) => configs.find((c) => c.key === tc.key)?.value !== tc.value,
      );

      for (const config of changedConfigs) {
        await api.put(`/system-configs/${config.key}`, {
          value: config.value,
        });
      }

      const res = await api.get("/system-configs");
      setConfigs(res.data.data);
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Cấu hình hệ thống"
      breadcrumbs={["Cài đặt", "Cấu hình hệ thống"]}
      showZoom={true}
      actions={
        <Box sx={{ p: 1, display: "flex", gap: 1.5 }}>
          <Button
            onClick={onClose}
            sx={{
              color: "#637381",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#F4F6F8" },
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            startIcon={<SaveOutlined />}
            sx={{
              background: "linear-gradient(135deg, #007BFF 0%, #0056b3 100%)",
              fontWeight: 600,
              textTransform: "none",
              px: 4,
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 123, 255, 0.24)",
              "&:hover": {
                background: "linear-gradient(135deg, #0069d9 0%, #004a99 100%)",
                boxShadow: "0 6px 16px rgba(0, 123, 255, 0.32)",
              },
            }}
          >
            Lưu thay đổi
          </Button>
        </Box>
      }
    >
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            backgroundColor: "#F0F7FF",
            border: "1px solid #C2E0FF",
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
          }}
        >
          <InfoOutlined sx={{ color: "#007BFF", mt: 0.2 }} />
          <Typography
            variant="body2"
            sx={{ color: "#004B99", lineHeight: 1.6 }}
          >
            Thay đổi các giá trị cấu hình hệ thống dưới đây để tùy chỉnh hành vi
            của ứng dụng.
            <strong> Lưu ý:</strong> Bạn chỉ có quyền chỉnh sửa giá trị, các
            tham số kỹ thuật được giữ cố định.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tempConfigs.map((config, index) => (
            <Fade
              in={true}
              style={{ transitionDelay: `${index * 50}ms` }}
              key={config.key}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #E5E8EB",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#007BFF",
                    boxShadow: "0 8px 24px rgba(145, 158, 171, 0.12)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Grid container spacing={3} alignItems="flex-start">
                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TranslateOutlined
                          sx={{ fontSize: 18, color: "#919EAB" }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: "#212B36",
                            letterSpacing: 0.5,
                          }}
                        >
                          {config.key}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#637381", pl: 3.2, fontStyle: "italic" }}
                      >
                        {config.description ||
                          "Không có mô tả cho cấu hình này."}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={config.value}
                      onChange={(e) =>
                        handleChangeValue(config.key, e.target.value)
                      }
                      placeholder="Nhập giá trị mới..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          backgroundColor: "#F9FAFB",
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor: "#F4F6F8",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "#fff",
                            boxShadow: "0 0 0 4px rgba(0, 123, 255, 0.1)",
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 4,
                                height: 20,
                                bgcolor: "#007BFF",
                                borderRadius: 1,
                                mr: 0.5,
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Fade>
          ))}
        </Box>

        {tempConfigs.length === 0 && (
          <Box
            sx={{
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              opacity: 0.5,
            }}
          >
            <SettingsIcon sx={{ fontSize: 48, color: "#919EAB" }} />
            <Typography sx={{ color: "#637381", fontWeight: 500 }}>
              Chưa có dữ liệu cấu hình hệ thống
            </Typography>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
}
