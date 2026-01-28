import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  Stack,
} from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";

interface ImportErrorDialogProps {
  open: boolean;
  onClose: () => void;
  errors: string[];
}

const ImportErrorDialog: React.FC<ImportErrorDialogProps> = ({
  open,
  onClose,
  errors,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="column" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ErrorIcon color="error" sx={{ fontSize: 32 }} />
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
              Lỗi Import Dữ Liệu
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{ color: "text.primary", pl: 0.5 }}
          >
            Có {errors?.length || 0} lỗi cần sửa trong file Excel:
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          // Ẩn thanh cuộn cho Chrome, Safari và các trình duyệt dùng Webkit
          "&::-webkit-scrollbar": {
            display: "none",
          },
          // Ẩn thanh cuộn cho IE, Edge
          msOverflowStyle: "none",
          // Ẩn thanh cuộn cho Firefox
          scrollbarWidth: "none",
        }}
      >
        <List sx={{ pt: 1 }}>
          {errors.map((error, index) => (
            <ListItem
              key={index}
              disableGutters
              sx={{
                mb: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "#fff1f0",
                border: "1px solid #ffa39e",
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              {/* Vòng tròn số thứ tự */}
              <Box
                sx={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "#ff4d4f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 12,
                  fontWeight: "bold",
                  mt: 0.2,
                }}
              >
                {index + 1}
              </Box>
              <Typography
                variant="body2"
                color="#cf1322"
                sx={{ lineHeight: 1.6 }}
              >
                {error}
              </Typography>
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="text"
          sx={{ color: "#595959", fontWeight: 600 }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportErrorDialog;
