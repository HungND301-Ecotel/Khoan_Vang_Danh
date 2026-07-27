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
import { Dispatch, SetStateAction, useState } from "react";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import {
  AssignmentCodeOutputType,
  MaterialAssignmentInputType,
  Materials,
  UnitType,
} from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../config/api.config";
import { Divider } from "antd";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import FieldDate from "../../../ui/FieldDate";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";
import BaseModal from "../../../components/Common/BaseModal";
dayjs.extend(utc);

const validationSchema = (isOutPlan: boolean) =>
  yup.object({
    assignmentCode: isOutPlan
      ? yup.string().optional()
      : yup.string().required("Mã giao khoán không được để trống"),
    code: yup.string().required("Mã vật tư không được để trống"),
    name: yup.string().required("Tên vật tư giao khoán không được để trống"),
  });

// Format date dd/MM/yyyy
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function MaterialAssignmentModal({
  open,
  setOpen,
  handleSubmit,
  selectedMaterialAssignment,
  minimizedData,
  onMinimize,
  clearMinimize,
  isOutPlan = false,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialAssignmentInputType>) => void;
  selectedMaterialAssignment: Materials | null;
  minimizedData?: any;
  onMinimize?: (data: any) => void;
  clearMinimize?: () => void;
  isOutPlan?: boolean;
}) {
  const {
    data: assignmentCodes = {
      data: [],
    },
  } = useQuery({
    queryKey: ["assignmentCodes"],
    queryFn: () => api.get("/assignmentcodes").then((res) => res.data.data),
  });

  const { data: units = { data: [] } } = useQuery({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data.data),
  });

  const formik = useFormik({
    initialValues: {
      code: minimizedData
        ? minimizedData.code
        : selectedMaterialAssignment
          ? selectedMaterialAssignment.code
          : "",
      name: minimizedData
        ? minimizedData.name
        : selectedMaterialAssignment
          ? selectedMaterialAssignment.name
          : "",
      uom: minimizedData
        ? minimizedData.uom
        : selectedMaterialAssignment
          ? selectedMaterialAssignment.uom?._id
          : "",
      quantity: minimizedData
        ? minimizedData.quantity
        : selectedMaterialAssignment
          ? selectedMaterialAssignment.quantity
          : 0,
      assignmentCode: minimizedData
        ? minimizedData.assignmentCode
        : selectedMaterialAssignment
          ? selectedMaterialAssignment.assignmentCode?._id
          : "",
      priceHistory: minimizedData
        ? minimizedData.priceHistory
        : selectedMaterialAssignment &&
            Array.isArray(selectedMaterialAssignment.priceHistory)
          ? selectedMaterialAssignment.priceHistory.map((item) => ({
              startDate: item.startDate || "",
              endDate: item.endDate || "",
              executionPrice: item.executionPrice || 0,
              plannedPrice: item.plannedPrice || 0,
            }))
          : [
              {
                startDate: formatDate(new Date()),
                endDate: formatDate(new Date()),
                executionPrice: 0,
                plannedPrice: 0,
              },
            ],
    },
    enableReinitialize: true,
    validationSchema: validationSchema(isOutPlan),
    onSubmit: (values) => {
      const transformedValues: MaterialAssignmentInputType = {
        ...values,
        quantity:
          values.quantity === undefined || typeof values.quantity === "number"
            ? values.quantity
            : Number(values.quantity),
        priceHistory: values.priceHistory.map((item: any) => ({
          ...item,
          executionPrice: Number(item.executionPrice),
          plannedPrice: item.plannedPrice ? Number(item.plannedPrice) : null,
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

  const titleSuffix = isOutPlan ? "ngoài khoán" : "trong khoán";
  const breadcrumbSuffix = isOutPlan ? "ngoài khoán" : "trong khoán";

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      onMinimize={handleMinimize}
      title={
        selectedMaterialAssignment || minimizedData?._id
          ? `Chỉnh sửa vật tư, tài sản ${titleSuffix}`
          : `Tạo mới vật tư, tài sản ${titleSuffix}`
      }
      breadcrumbs={["Danh mục", `Vật tư, tài sản ${breadcrumbSuffix}`]}
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
            {selectedMaterialAssignment || minimizedData?._id
              ? "Cập nhật"
              : "Xác nhận"}
          </Button>
        </>
      }
    >
      <FormikProvider value={formik}>
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Mã giao khoán - chỉ hiển thị khi trong khoán */}
            {!isOutPlan && (
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Mã giao khoán
                </Typography>
                <FieldAutoCompleted
                  formik={formik}
                  field="assignmentCode"
                  labelkey="code"
                  title=""
                  data={assignmentCodes.data}
                />
              </Box>
            )}

            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Mã vật tư, tài sản
              </Typography>
              <FieldInput formik={formik} field="code" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                Tên vật tư, tài sản
              </Typography>
              <FieldInput formik={formik} field="name" />
            </Box>

            {/* Số lượng - chỉ hiển thị khi trong khoán */}
            {!isOutPlan && (
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                  Số lượng
                </Typography>
                <TextFieldNumber formik={formik} field="quantity" />
              </Box>
            )}

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

            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 2 }}>
                Đơn giá theo ngày
              </Typography>
              <FieldArray name="priceHistory">
                {({ push, remove }) => (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {formik.values.priceHistory.map(
                      (item: any, index: number) => (
                        <Box key={index}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3}>
                              <Typography
                                sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                              >
                                Từ ngày
                              </Typography>
                              <FieldDate
                                formik={formik}
                                fieldName={`priceHistory.${index}.startDate`}
                              />
                            </Grid>
                            <Grid item xs={3}>
                              <Typography
                                sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                              >
                                Đến ngày
                              </Typography>
                              <FieldDate
                                formik={formik}
                                fieldName={`priceHistory.${index}.endDate`}
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <Typography
                                sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                              >
                                Đơn giá kế hoạch
                              </Typography>
                              <TextFieldNumber
                                formik={formik}
                                field={`priceHistory.${index}.plannedPrice`}
                              />
                            </Grid>
                            <Grid item xs={3}>
                              <Typography
                                sx={{ fontSize: "12px", color: "#666", mb: 1 }}
                              >
                                Đơn giá thực hiện
                              </Typography>
                              <TextFieldNumber
                                formik={formik}
                                field={`priceHistory.${index}.executionPrice`}
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
                        </Box>
                      ),
                    )}

                    {/* Add button */}
                    <Box textAlign="right" sx={{ mt: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={() =>
                          push({
                            startDate: formatDate(new Date()),
                            endDate: formatDate(new Date()),
                            executionPrice: 0,
                            plannedPrice: 0,
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
