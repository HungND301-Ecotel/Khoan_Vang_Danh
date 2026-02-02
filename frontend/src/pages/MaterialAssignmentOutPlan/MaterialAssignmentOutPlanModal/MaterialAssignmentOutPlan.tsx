import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import {
  MaterialAssignmentInputType,
  Materials,
  UnitType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Divider } from "antd";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import FieldMonthYear from "../../../ui/FieldMonth_Year";
dayjs.extend(utc);

const validationSchema = yup.object({
  code: yup.string().required("Mã vật tư giao khoán không được để trống"),
  name: yup.string().required("Tên vật tư giao khoán không được để trống"),
});

export default function MaterialAssignmentOutPlanModal({
  open,
  setOpen,
  handleSubmit,
  selectedMaterialAssignment,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialAssignmentInputType>) => void;
  selectedMaterialAssignment: Materials | null;
}) {
  const { data: assignmentCodes = [] } = useQuery({
    queryKey: ["assignmentCodes"],
    queryFn: () => api.get("/assignmentcodes").then((res) => res.data.data),
  });

  const {
    data: units = {
      data: [],
    },
  } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: selectedMaterialAssignment ? selectedMaterialAssignment.code : "",
      name: selectedMaterialAssignment ? selectedMaterialAssignment.name : "",
      uom: selectedMaterialAssignment
        ? selectedMaterialAssignment.uom?._id
        : "",
      priceHistory:
        selectedMaterialAssignment &&
        Array.isArray(selectedMaterialAssignment.priceHistory)
          ? selectedMaterialAssignment.priceHistory.map((item) => ({
              price: item.price,
              startMonth: item.startMonth
                ? dayjs(item.startMonth).format("YYYY-MM")
                : "",
              endMonth: item.endMonth
                ? dayjs(item.endMonth).format("YYYY-MM")
                : "",
            }))
          : [
              {
                price: 0,
                startMonth: dayjs(new Date()).format("YYYY-MM"),
                endMonth: dayjs(new Date()).format("YYYY-MM"),
              },
            ],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const transformedValues: MaterialAssignmentInputType = {
        ...values,
        priceHistory: values.priceHistory.map((item) => ({
          ...item,
          startMonth: dayjs(new Date(item.startMonth)).format("YYYY-MM"),
          endMonth: dayjs(new Date(item.endMonth)).format("YYYY-MM"),
        })),
      };
      handleSubmit(transformedValues);
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: "800px",
          height: "740px",
          p: "32px",
          position: "relative",
          borderRadius: "12px",
        },
      }}
    >
      {/* Nút X góc trên phải */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "16px",
          right: "16px",
          width: "24px",
          height: "24px",
          opacity: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: "20px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "14px" }}>
          <Typography sx={{ color: "#666" }}>Danh mục</Typography>
          <Typography sx={{ color: "#666" }}>Vật tư, tài sản</Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "8px 0 16px 0",
            borderBlockWidth: 1,
            opacity: "20%",
            borderColor: "#ccc",
          }}
        />
        <Typography
          sx={{ fontSize: "20px", color: "#1976d2", fontWeight: 500 }}
        >
          {selectedMaterialAssignment
            ? "Chỉnh sửa Vật tư, tài sản khác"
            : "Tạo mới Vật tư, tài sản khác"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Mã vật tư, tài sản */}
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Mã vật tư, tài sản
                </Typography>
                <TextField
                  fullWidth
                  id="code"
                  name="code"
                  placeholder="Input Text"
                  value={formik.values.code}
                  onChange={formik.handleChange}
                  error={formik.touched.code && Boolean(formik.errors.code)}
                  helperText={formik.touched.code && formik.errors.code}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>

              {/* Tên vật tư, tài sản */}
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Tên vật tư, tài sản
                </Typography>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  placeholder="Input Text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                />
              </Box>

              {/* Đơn vị tính */}
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Đơn vị tính
                </Typography>
                <TextField
                  fullWidth
                  select
                  id="uom"
                  name="uom"
                  placeholder="Placeholder"
                  value={formik.values.uom}
                  onChange={formik.handleChange}
                  error={formik.touched.uom && Boolean(formik.errors.uom)}
                  helperText={formik.touched.uom && formik.errors.uom}
                  variant="outlined"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "40px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    },
                  }}
                >
                  {units.data.map((unit: UnitType) => (
                    <MenuItem key={unit._id} value={unit._id}>
                      {unit.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Đơn giá section */}
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 2 }}>
                  Đơn giá
                </Typography>
                <FieldArray name="priceHistory">
                  {({ push, remove }) => (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {formik.values.priceHistory.map((item, index) => (
                        <Grid
                          container
                          spacing={2}
                          key={index}
                          alignItems="center"
                        >
                          <Grid item xs={4}>
                            <Typography
                              sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                            >
                              Từ tháng
                            </Typography>
                            {/* <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                              <DatePicker
                                label="Chọn tháng"
                                inputFormat="MM/YYYY" // v5 vẫn hỗ trợ
                                views={["year", "month"]}
                                openTo="month"
                                value={
                                  formik.values.priceHistory[index].startMonth || ''
                                }
                                onChange={(value) => {
                                  formik.setFieldValue(
                                    `priceHistory[${index}].startMonth`,
                                    value ? dayjs(value).format("YYYY-MM") : ""
                                  );
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    fullWidth
                                    size="small"
                                    sx={{ backgroundColor: "#fff" }}
                                  />
                                )}
                              />
                            </LocalizationProvider> */}
                            <FieldMonthYear
                              formik={formik}
                              fieldName={`priceHistory.${index}.startMonth`}
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <Typography
                              sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                            >
                              Đến tháng
                            </Typography>
                            <FieldMonthYear
                              formik={formik}
                              fieldName={`priceHistory.${index}.endMonth`}
                            />
                          </Grid>

                          <Grid item xs={3}>
                            <Typography
                              sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                            >
                              Đơn giá
                            </Typography>
                            <TextField
                              fullWidth
                              type="number"
                              name={`priceHistory[${index}].price`}
                              placeholder="Placeholder"
                              value={formik.values.priceHistory[index].price}
                              onChange={(e) =>
                                formik.setFieldValue(
                                  `priceHistory[${index}].price`,
                                  e.target.value,
                                )
                              }
                              variant="outlined"
                              sx={{
                                "& .MuiInputBase-root": {
                                  height: "40px",
                                  borderRadius: "6px",
                                  fontSize: "14px",
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={1}>
                            {formik.values.priceHistory.length > 1 && (
                              <IconButton
                                color="error"
                                onClick={() => remove(index)}
                                sx={{ mt: 2 }}
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </Grid>
                        </Grid>
                      ))}

                      {/* Add button */}
                      <Box textAlign="right" sx={{ mt: 1 }}>
                        <IconButton
                          color="primary"
                          onClick={() =>
                            push({
                              price: 0,
                              startMonth: dayjs(new Date()).format("YYYY-MM"),
                              endMonth: dayjs(new Date()).format("YYYY-MM"),
                            })
                          }
                        >
                          <Add />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </FieldArray>
              </Box>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>
      {/* Action buttons */}
      <DialogActions
        sx={{ mt: 4, px: 0, gap: "12px", justifyContent: "flex-end" }}
      >
        <Button
          onClick={handleClose}
          sx={{
            backgroundColor: "#f5f5f5",
            color: "#666",
            borderRadius: "8px",
            height: "40px",
            minWidth: "80px",
            fontSize: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e0e0e0",
            },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={() => formik.submitForm()}
          variant="contained"
          sx={{
            backgroundColor: "#1976d2",
            borderRadius: "8px",
            height: "40px",
            minWidth: "100px",
            fontSize: "14px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
          }}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
}
