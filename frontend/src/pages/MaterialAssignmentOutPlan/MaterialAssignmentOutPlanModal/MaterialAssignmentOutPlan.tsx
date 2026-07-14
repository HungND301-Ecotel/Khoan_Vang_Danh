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
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldInput from "../../../components/TextField/FieldInput";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import BaseModal from "../../../components/Common/BaseModal";
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
  minimizedData,
  onMinimize,
  clearMinimize,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialAssignmentInputType>) => void;
  selectedMaterialAssignment: Materials | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
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
      code: minimizedData ? minimizedData.code : (selectedMaterialAssignment ? selectedMaterialAssignment.code : ""),
      name: minimizedData ? minimizedData.name : (selectedMaterialAssignment ? selectedMaterialAssignment.name : ""),
      uom: minimizedData ? minimizedData.uom : (selectedMaterialAssignment
        ? selectedMaterialAssignment.uom?._id
        : ""),
      priceHistory: minimizedData ? minimizedData.priceHistory : (
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
            ]),
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const transformedValues: MaterialAssignmentInputType = {
        ...values,
        priceHistory: values.priceHistory.map((item: any) => ({
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
    if (clearMinimize) clearMinimize();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize({ ...formik.values, _id: selectedMaterialAssignment?._id || minimizedData?._id });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={(selectedMaterialAssignment || minimizedData?._id) ? "Chỉnh sửa vật tư, tài sản ngoài khoán"
          : "Tạo mới vật tư, tài sản ngoài khoán"
      }
      breadcrumbs={["Danh mục", "Vật tư, tài sản ngoài khoán"]}
      showZoom={true}
      actions={
        <>
          <Button
            onClick={handleClose}
            sx={{
              backgroundColor: "#DFE2EA",
              borderRadius: "8px",
              height: "32px",
              minWidth: "91px",
              fontSize: "14px",
              textTransform: "none",
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={() => formik.submitForm()}
            variant="contained"
            sx={{
              backgroundColor: "#007BFF",
              borderRadius: "8px",
              height: "32px",
              minWidth: "91px",
              fontSize: "14px",
              textTransform: "none",
            }}
          >
            {(selectedMaterialAssignment || minimizedData?._id) ? "Cập nhật" : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Mã vật tư, tài sản */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã vật tư, tài sản
              </Typography>
              <FieldInput formik={formik} field="code" />
            </Box>

            {/* Tên vật tư, tài sản */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tên vật tư, tài sản
              </Typography>
              <FieldInput formik={formik} field="name" />
            </Box>

            {/* Đơn vị tính */}
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Đơn vị tính
              </Typography>
              <FieldAutoCompleted
                formik={formik}
                field="uom"
                labelkey="name"
                title=""
                data={units.data}
              />
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
                    {formik.values.priceHistory.map((item: any, index: number) => (
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
                          <TextFieldNumber
                            formik={formik}
                            field={`priceHistory.${index}.price`}
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
    </BaseModal>
  );
}
