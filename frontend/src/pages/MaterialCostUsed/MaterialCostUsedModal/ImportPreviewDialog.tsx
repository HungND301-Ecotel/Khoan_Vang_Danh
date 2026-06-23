import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AddCircle } from "@mui/icons-material";
import { PreviewRow } from "./types";

interface ImportPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  previewData: PreviewRow[];
  setPreviewData: (data: PreviewRow[]) => void;
  onSave: () => void;
  handleCreateMaterial: (row: PreviewRow, index: number) => void;
}

export default function ImportPreviewDialog({
  open,
  onClose,
  previewData,
  setPreviewData,
  onSave,
  handleCreateMaterial,
}: ImportPreviewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Xem trước kết quả tải lên</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã vật tư</TableCell>
                <TableCell>Tên vật tư</TableCell>
                <TableCell>Mã giao khoán</TableCell>
                <TableCell>Tên giao khoán</TableCell>
                <TableCell>Số lượng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor:
                      row.status === "valid" ? "#e8f5e9" : "#ffebee",
                  }}
                >
                  <TableCell>{row.code}</TableCell>

                  <TableCell>
                    {row.status === "missing_material" ? (
                      <TextField
                        size="small"
                        placeholder="Nhập tên vật tư..."
                        value={row.materialName || ""}
                        onChange={(e) => {
                          const newData = [...previewData];
                          newData[index].materialName = e.target.value;
                          setPreviewData(newData);
                        }}
                        sx={{ minWidth: 160 }}
                      />
                    ) : (
                      row.matchingmaterial?.name ||
                      row.matchingMaterials?.[0]?.name ||
                      ""
                    )}
                  </TableCell>

                  <TableCell>
                    {row.matchingMaterials?.length > 1 ||
                    row.status === "missing_material" ||
                    row.status === "need_assignment" ? (
                      <Select
                        size="small"
                        value={row.selectedAssignmentId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newData = [...previewData];
                          newData[index].selectedAssignmentId = val;

                          const selectedAc = newData[
                            index
                          ].availableAssignments?.find(
                            (a: any) => a._id === val,
                          );
                          newData[index].selectedAssignmentName =
                            selectedAc?.name || selectedAc?.code || "";

                          if (newData[index].matchingMaterials?.length > 1) {
                            const mat = newData[index].matchingMaterials.find(
                              (m: any) =>
                                (m.assignmentCode?._id || "none") === val,
                            );
                            if (mat) {
                              newData[index].matchingmaterial = mat;
                              newData[index].matchingassignment =
                                mat.assignmentCode;
                              newData[index].status = "valid";
                              newData[index].message = "Hợp lệ";
                            }
                          }
                          setPreviewData(newData);
                        }}
                        displayEmpty
                        sx={{ minWidth: 120, height: 32 }}
                      >
                        <MenuItem value="" disabled>
                          Chọn mã
                        </MenuItem>
                        {row.availableAssignments?.map((a: any) => (
                          <MenuItem key={a._id} value={a._id}>
                            {a.code}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      row.matchingassignment?.code || "Không có"
                    )}
                  </TableCell>

                  <TableCell>
                    {row.matchingMaterials?.length > 1 ||
                    row.status === "missing_material" ||
                    row.status === "need_assignment"
                      ? row.selectedAssignmentName || ""
                      : row.matchingassignment?.name ||
                        row.matchingassignment?.code ||
                        (row.matchingassignment === null ? "Không có" : "")}
                  </TableCell>

                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        row.status === "valid" ? "success.main" : "error.main"
                      }
                    >
                      {row.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.status === "missing_material" && (
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleCreateMaterial(row, index)}
                        title="Tạo vật tư"
                        disabled={!row.materialName?.trim()}
                      >
                        <AddCircle />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          disabled={previewData.every((r) => r.status !== "valid")}
        >
          Lưu vào danh sách
        </Button>
      </DialogActions>
    </Dialog>
  );
}
