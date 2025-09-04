import { Add, Delete, PriceChange, YouTube } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";
import React, { Dispatch, SetStateAction } from "react";
import * as yup from "yup";
import { FieldArray, FormikProvider, useFormik } from "formik";
import {
  AssignmentCodeOutputType,
  MaterialAssignmentInputType,
  Materials,
  UnitType,
} from "../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
dayjs.extend(utc);

const validationSchema = yup.object({
  name: yup.string().required("Tên vật tư giao khoán không được để trống"),
});
export default function MaterialAssignmentModal({
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

  const { data: units = [] } = useQuery({
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
      quantity: selectedMaterialAssignment
        ? selectedMaterialAssignment.quantity
        : "",
      assignmentCode: selectedMaterialAssignment
        ? selectedMaterialAssignment.assignmentCode?._id
        : "",
      priceHistory: selectedMaterialAssignment?.priceHistory?.map((item) => ({
        price: item.price,
        startDate: new Date(item.startDate).toISOString().substring(0, 10),
        endDate: new Date(item.endDate).toISOString().substring(0, 10),
      })) || [
        {
          price: 0,
          startDate: new Date().toISOString().substring(0, 10),
          endDate: new Date().toISOString().substring(0, 10),
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
          startDate: item.startDate,
          endDate: item.endDate,
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedMaterialAssignment ? "Sửa vật tư" : "Tạo mới vật tư"}
      </DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                select
                id="assignmentCode"
                name="assignmentCode"
                label="Mã giao khoán"
                value={formik.values.assignmentCode}
                onChange={(event) => {
                  formik.setFieldValue("assignmentCode", event.target.value);
                }}
                error={
                  formik.touched.assignmentCode &&
                  Boolean(formik.errors.assignmentCode)
                }
                helperText={
                  formik.touched.assignmentCode && formik.errors.assignmentCode
                }
              >
                {assignmentCodes.map(
                  (assignmentCode: AssignmentCodeOutputType) => (
                    <MenuItem
                      key={assignmentCode._id}
                      value={assignmentCode._id}
                    >
                      {assignmentCode.code}
                    </MenuItem>
                  )
                )}
              </TextField>
              <TextField
                fullWidth
                id="code"
                name="code"
                label="Mã vật tư, tài sản"
                value={formik.values.code}
                onChange={formik.handleChange}
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
              />
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Tên vật tư, tài sản"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              <TextField
                fullWidth
                id="quantity"
                name="quantity"
                label="Số lượng"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                error={
                  formik.touched.quantity && Boolean(formik.errors.quantity)
                }
                helperText={formik.touched.quantity && formik.errors.quantity}
              />
              <TextField
                fullWidth
                select
                id="uom"
                name="uom"
                label="Đơn vị tính"
                value={formik.values.uom}
                onChange={formik.handleChange}
                error={formik.touched.uom && Boolean(formik.errors.uom)}
                helperText={formik.touched.uom && formik.errors.uom}
              >
                {units.map((unit: UnitType) => (
                  <MenuItem value={unit._id}>{unit.name}</MenuItem>
                ))}
              </TextField>
              <FieldArray name="priceHistory">
                {({ push, remove }) => (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {formik.values.priceHistory.map((item, index) => (
                      <Box
                        key={index}
                        sx={{ display: "flex", gap: 2, alignItems: "center" }}
                      >
                        <TextField
                          fullWidth
                          label="Ngày bắt đầu"
                          type="date"
                          name={`priceHistory[${index}].startDate`}
                          value={formik.values.priceHistory[index].startDate
                            .toString()
                            .substring(0, 10)}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `priceHistory[${index}].startDate`,
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Ngày kết thúc"
                          type="date"
                          name={`priceHistory[${index}].endDate`}
                          value={formik.values.priceHistory[index].endDate
                            .toString()
                            .substring(0, 10)}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `priceHistory[${index}].endDate`,
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          label="Đơn giá"
                          type="number"
                          name={`priceHistory[${index}].price`}
                          value={formik.values.priceHistory[index].price}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `priceHistory[${index}].price`,
                              e.target.value
                            )
                          }
                        />
                        <IconButton color="error" onClick={() => remove(index)}>
                          <Delete />
                        </IconButton>
                      </Box>
                    ))}
                    <Box textAlign="right">
                      <IconButton
                        color="primary"
                        onClick={() =>
                          push({
                            price: 0,
                            startDate: new Date()
                              .toISOString()
                              .substring(0, 10),
                            endDate: new Date().toISOString().substring(0, 10),
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
        </FormikProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button onClick={() => formik.submitForm()} variant="contained">
          {selectedMaterialAssignment ? "Cập nhật" : "Thêm mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}