import { useQuery } from "@tanstack/react-query";
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { FieldArray, FormikProvider, useFormik, FormikErrors } from "formik";
import api from "../../config/api.config";
import {
  MaterialCostUsedInputType,
  ProductionScopeOutputType,
  AssignmentNormOutputType,
  AdjustmentNormOutputType,
  PhaseOutputType,
  PhaseType,
  InitialPlannedCostInputType,
  InitialPlannedCostOutputType,
} from "../../types";
import { Add, Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import * as yup from 'yup'

const validationSchema = yup.object({
  productionScope: yup.string().required("Diện sản xuất không được để trống"),
  group: yup.array().of(
    yup.object().shape({
      startDate: yup.string().required("Bắt buộc"),
      endDate: yup.string().required("Bắt buộc"),
      phases: yup.array().of(
        yup.object().shape({
          production: yup.number().min(1, "Sản lượng phải lớn hơn 0").required("Bắt buộc"),
          unit: yup.string().required("Bắt buộc"),
          assignmentNormCode: yup.string().required("Bắt buộc"),
          adjustmentNormCode: yup.string().required("Bắt buộc")
        })
      )
    })
  ).min(1, "Cần ít nhất một công đoạn"),
})

export default function InitialPlannedCostModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  deleteMutation
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialCostUsedInputType>) => void;
  selected: InitialPlannedCostOutputType | null;
  deleteMutation: (ids: string[]) => void
}) {
  const [phaseGroupsForQuery, setPhaseGroupsForQuery] = useState<{ [key: number]: string }>({});
  const [visiable, setVisiable] = useState<Number[]>([])
  const [scope, setScope] = useState<ProductionScopeOutputType | null>(null)

  const [deletedIds, setDeletedIds] = useState<string[]>([])

  useEffect(() => {
    if (selected) {
      const scope = productionscopes.data.find((i: ProductionScopeOutputType) => i._id === selected.productionScope?._id)
      setScope(scope || null)
    }

  }, [selected])


  const handleView = (index: number) => {
    if (visiable.includes(index)) {
      setVisiable(visiable.filter(i => i !== index))
    } else {
      setVisiable([...visiable, index])
    }
  }

  const { data: productionscopes = { data: [] } } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });
  const { data: phaseGroups = { data: [] } } = useQuery({
    queryKey: ["phaseGroups"],
    queryFn: async () =>
      api.get("/phaseGroups").then((res) => res.data.data),
  });

  const { data: assignmentnorms = { data: [] } } = useQuery({
    queryKey: ["assignmentnorms"],
    queryFn: async () =>
      api.get("/assignmentnorms").then((res) => res.data.data),
  });

  const { data: adjustmentnorms = { data: [] } } = useQuery({
    queryKey: ["adjustmentnorms"],
    queryFn: async () =>
      api.get("/adjustmentnorms").then((res) => res.data.data),
  });
  // Initial values
  const formik = useFormik({
    initialValues: {
      productionScope: selected?.productionScope?._id
        ? String(selected.productionScope._id)
        : "",
      group: (selected?.group || []).map((g) => ({
        _id: g?._id,
        startDate: new Date(g.startDate).toISOString().substring(0, 10),
        endDate: new Date(g.endDate).toISOString().substring(0, 10),
        phases: (g?.phases || []).map((p: any) => ({
          phase: p.phase?._id ? String(p.phase._id) : "",
          production: Number(p.production ?? 0),                 // CHANGED
          unit: p.phase?.unit ?? (p.phase?.name?.toLowerCase()?.includes('khấu than') ? 'tấn' : 'mét'),                            // CHANGED
          assignmentNormCode: p.assignmentNormCode?._id,        // CHANGED
          adjustmentNormCode: p.adjustmentNormCode?._id,        // CHANGED
        })),
      }))
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      // Đóng gói payload đảm bảo phases luôn có unit
      const payload: Partial<InitialPlannedCostInputType>[] = values.group.map((v) => ({
        _id: v?._id,
        productionScope: values?.productionScope,
        startDate: new Date(v.startDate).toISOString().substring(0, 10),
        endDate: new Date(v.endDate).toISOString().substring(0, 10),
        phases: (v.phases || []).map((p: any) => ({
          phase: p.phase ?? "",
          production: Number(p.production ?? 0),
          unit: String(p.unit ?? ""),                         // CHANGED
          assignmentNormCode: p.assignmentNormCode,
          adjustmentNormCode: p.adjustmentNormCode,
        })),

      }))
      for (let p of payload) {
        console.log("SUBMIT payload:", p); // kiểm tra nhanh trên DevTools
        handleSubmit(p);
      }
      if (deletedIds.length > 0) {
        deleteMutation(deletedIds)
      }
    },
  });



  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  const handlePhaseChange = (
    indexParent: number,
    index: number,
    field: keyof PhaseType,
    value: any
  ) => {
    const path = `group[${indexParent}].phases[${index}].${field}`;
    formik.setFieldValue(path, value);

    // Nếu đổi nhóm công đoạn, reset lại phase
    if (field === "phaseGroup") {
      formik.setFieldValue(`group[${indexParent}].phases[${index}].phase`, "");
      setPhaseGroupsForQuery({
        ...phaseGroupsForQuery,
        [index]: value
      });
    }
  };
  const getError = (indexParent: number, index: number, field: keyof any) => {
    const errors = formik.errors.group as any;
    const touched = formik.touched.group as any;

    const err = errors?.[indexParent]?.phases?.[index]?.[field];
    const tch = touched?.[indexParent]?.phases?.[index]?.[field];

    return tch && err ? err : "";
  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          // width: "800px",
          height: "740px",
          p: "40px",
          backgroundColor: "#F1F2F5",
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "40px",
          right: "40px",
          width: "16px",
          height: "16px",
          opacity: 1,
        }}
      >
        <CloseIcon sx={{ fontSize: "16px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0 }}>
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ fontSize: "14px", mb: "12px" }}
        >
          <Typography>Thống kê vận hành</Typography>
          <Typography>Chi phí kế hoạch ban đầu</Typography>
        </Breadcrumbs>

        <Divider
          sx={{
            mb: "12px",
            borderColor: "#6592B7",
            opacity: 0.3,
            borderWidth: "1px",
          }}
        />

        {selected ? (
          <Typography sx={{ fontSize: "24px", color: "#2B4A82" }}>
            Chỉnh sửa Chi phí kế hoạch ban đầu
          </Typography>
        ) : (
          <Typography
            sx={{ fontSize: "24px", color: "#2B4A82", fontWeight: 400 }}
          >
            Tạo mới Chi phí kế hoạch ban đầu
          </Typography>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          "& input": {
            caretColor: "transparent",
          },
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#F1F2F5",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#F1F2F5",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#E1E2E5",
          },
          scrollbarWidth: "thin",
          scrollbarColor: "#F1F2F5 #F1F2F5",
        }}
      >
        <FormikProvider value={formik}>
          {/* Mã diện sản xuất */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Mã diện sản xuất
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", width: '100%' }}>
            <TextField
              select
              fullWidth
              value={formik.values.productionScope || ""}
              onChange={(event) => {
                const scopeId = event.target.value;
                formik.setFieldValue("productionScope", scopeId);

                const scope = productionscopes.data.find(
                  (ps: ProductionScopeOutputType) => ps._id === scopeId
                );
                setScope(scope)

                // nếu scope có mảng phases thì map ra
                if (scope && Array.isArray(scope.phases)) {
                  const mappedPhases = scope.phases.map((ph: any) => ({
                    phase: ph.phase?._id ?? "",
                    production: 0,               // CHANGED
                    unit: ph.phase?.name.toLowerCase().includes('khấu than') ? 'tấn' : 'mét',                    // CHANGED
                    assignmentNormCode: "",
                    adjustmentNormCode: "",
                  }));
                  formik.setFieldValue(`group[${0}].phases`, mappedPhases);
                  setVisiable([0])
                } else {
                  formik.setFieldValue(`group[${0}].phases`, []);
                }
              }}
              variant="outlined"
              error={formik.touched.productionScope && Boolean(formik.errors.productionScope)}
              helperText={formik.touched.productionScope && formik.errors.productionScope}
              InputProps={{
                startAdornment: formik.values.productionScope ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Chọn mã diện sản xuất
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
              }}
            >
              {productionscopes?.data.map((item: ProductionScopeOutputType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.code}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <FieldArray name="group">
            {({ push, remove }) => (
              <Box sx={{ mt: 1 }}>
                {formik.values.group.map((item: any, indexParent: number) => (
                  <Paper
                    elevation={0}
                    sx={{
                      border: "1px solid #d0d7de",
                      background: 'transparent',
                      borderRadius: "8px",
                      p: 2,
                      mt: 2,
                      position: 'relative'
                    }}
                  >
                    <Grid container spacing={2} key={indexParent} alignItems="center">
                      <Grid item xs={5}>
                        <Typography sx={{ fontSize: "12px", color: "#666", mb: 1 }}>
                          Ngày bắt đầu
                        </Typography>
                        <TextField
                          fullWidth
                          type="date"
                          name={`group[${indexParent}].startDate`}
                          value={formik.values.group[indexParent].startDate ? formik.values.group[indexParent].startDate.toString().substring(0, 10) : ''}
                          onChange={(e) =>
                            formik.setFieldValue(`group[${indexParent}].startDate`, e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          error={Boolean(
                            typeof formik.errors.group?.[indexParent] === 'object' &&
                            (formik.errors.group?.[indexParent] as any)?.startDate
                          )}
                          helperText={
                            typeof formik.errors.group?.[indexParent] === 'object'
                              ? (formik.errors.group?.[indexParent] as any)?.startDate
                              : ''
                          }
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "40px",
                              borderRadius: "6px",
                              fontSize: "14px",
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={5}>
                        <Typography sx={{ fontSize: "12px", color: "#666", mb: 1 }}>
                          Ngày kết thúc
                        </Typography>
                        <TextField
                          fullWidth
                          type="date"
                          name={`group[${indexParent}].endDate`}
                          value={formik.values.group[indexParent].endDate ? formik.values.group[indexParent].endDate.toString().substring(0, 10) : ''}
                          onChange={(e) =>
                            formik.setFieldValue(`group[${indexParent}].endDate`, e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          error={Boolean(
                            typeof formik.errors.group?.[indexParent] === 'object' &&
                            (formik.errors.group?.[indexParent] as any)?.endDate
                          )}
                          helperText={
                            typeof formik.errors.group?.[indexParent] === 'object'
                              ? (formik.errors.group?.[indexParent] as any)?.endDate
                              : ''
                          }
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "40px",
                              borderRadius: "6px",
                              fontSize: "14px",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        {formik.values.group.length > 1 && (
                          <IconButton
                            color="error"
                            onClick={() => {
                              remove(indexParent)
                              if (item._id) {
                                setDeletedIds([...deletedIds, item._id])
                              }
                            }}
                            sx={{ mt: 2 }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Grid>
                      {/* <IconButton
                        color="error"
                        onClick={() => handleView(indexParent)}
                        sx={{ mt: 2, position: 'absolute', right: 0, top: -20 }}
                      >
                        {visiable.some(i => i === indexParent) ? <Visibility /> : <VisibilityOff />}
                      </IconButton> */}
                    </Grid>

                    {/* {visiable.some(i => i === indexParent) && */}
                    <FieldArray name="phases">
                      {() => (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
                          {formik.values.group[indexParent].phases.map((item: any, index: number) => {
                            const phase = phaseGroups.data.find(
                              (pg: PhaseOutputType) => pg._id === item.phase
                            );

                            return (
                              <Paper
                                elevation={0}
                                sx={{
                                  border: "1px solid #d0d7de",
                                  background: 'transparent',
                                  borderRadius: "8px",
                                  p: 2,
                                  mt: 2,
                                  position: 'relative'
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "15px",
                                    color: "#444",
                                    position: 'absolute',
                                    top: -10,
                                    paddingInline: 2,
                                    zIndex: 999,
                                    background: "#f5f5f5",
                                  }}
                                >
                                  Công đoạn {index + 1}
                                </Typography>
                                <Box
                                  key={index}
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                      xs: "1fr",
                                      sm: "1fr 1fr",
                                      md: "1fr 1fr 1fr 1fr",
                                    },
                                    gap: 1.5,
                                    alignItems: "center",
                                    width: "100%",
                                  }}
                                >
                                  {/* Mã công đoạn */}
                                  <Box>
                                    <Typography
                                      sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}
                                    >
                                      Mã công đoạn
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={phase?.code || ""}
                                      InputLabelProps={{ shrink: true }}
                                      disabled
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "32px",
                                          borderRadius: "6px",
                                          paddingRight: "12px",
                                          paddingLeft: "12px",
                                          fontSize: "14px",
                                        },
                                      }}
                                    />
                                  </Box>

                                  {/* Tên công đoạn */}
                                  <Box>
                                    <Typography
                                      sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}
                                    >
                                      Tên công đoạn
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={phase?.name || ""}
                                      InputLabelProps={{ shrink: true }}
                                      disabled
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "32px",
                                          borderRadius: "6px",
                                          paddingRight: "12px",
                                          paddingLeft: "12px",
                                          fontSize: "14px",
                                        },
                                      }}
                                    />
                                  </Box>

                                  {/* Sản lượng */}
                                  <Box>
                                    <Typography
                                      sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}
                                    >
                                      Sản lượng
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      type="number"
                                      name={`group[${indexParent}].phases[${index}].production`}
                                      value={formik.values.group[indexParent]?.phases[index]?.production ?? 0}
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          `group[${indexParent}].phases[${index}].production`,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Placeholder"
                                      variant="outlined"
                                      error={Boolean(getError(indexParent, index, "production"))}
                                      helperText={getError(indexParent, index, "production")}
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "32px",
                                          borderRadius: "6px",
                                          px: "12px",
                                          fontSize: "14px",
                                        },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#D9D9D9",
                                        },
                                      }}
                                    />
                                  </Box>

                                  {/* Đơn vị tính */}
                                  <Box>
                                    <Typography
                                      sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}
                                    >
                                      Đơn vị tính
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      type="text"                                   // CHANGED
                                      name={`group[${indexParent}].phases[${index}].unit`}                 // CHANGED
                                      value={formik.values.group[indexParent]?.phases[index]?.unit}
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          `group[${indexParent}].phases[${index}].unit`,
                                          e.target.value
                                        )
                                      }
                                      placeholder="VD: mét, tấn ..."
                                      variant="outlined"
                                      error={Boolean(getError(indexParent, index, "unit"))}
                                      helperText={getError(indexParent, index, "unit")}
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "32px",
                                          borderRadius: "6px",
                                          px: "12px",
                                          fontSize: "14px",
                                        },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#D9D9D9",
                                        },
                                      }}
                                    />
                                  </Box>

                                  {/* Mã định mức giao khoán */}
                                  <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                                    <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                                      Mã định mức giao khoán
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      select
                                      value={item.assignmentNormCode || ""}
                                      onChange={(e) =>
                                        handlePhaseChange(indexParent, index, "assignmentNormCode", e.target.value)
                                      }
                                      error={Boolean(getError(indexParent, index, "assignmentNormCode"))}
                                      helperText={getError(indexParent, index, "assignmentNormCode")}
                                      variant="outlined"
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "40px",
                                          borderRadius: "4px",
                                          fontSize: "14px",
                                          backgroundColor: "#fff",
                                        },
                                        "& .MuiOutlinedInput-root": {
                                          "& fieldset": { borderColor: "#d0d7de" },
                                          "&:hover fieldset": { borderColor: "#0969da" },
                                        },
                                      }}
                                    >
                                      {assignmentnorms?.data.map((it: AssignmentNormOutputType) => (
                                        <MenuItem key={it._id} value={it._id}>
                                          {it.code}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Box>

                                  {/* Mã hệ số điều chỉnh định mức */}
                                  <Box sx={{ gridColumn: "1 / -1", mb: 2 }}>
                                    <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                                      Mã hệ số điều chỉnh định mức
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      select
                                      value={item.adjustmentNormCode || ""}
                                      onChange={(e) =>
                                        handlePhaseChange(indexParent, index, "adjustmentNormCode", e.target.value)
                                      }
                                      error={Boolean(getError(indexParent, index, "adjustmentNormCode"))}
                                      helperText={getError(indexParent, index, "adjustmentNormCode")}
                                      variant="outlined"
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "40px",
                                          borderRadius: "4px",
                                          fontSize: "14px",
                                          backgroundColor: "#fff",
                                        },
                                        "& .MuiOutlinedInput-root": {
                                          "& fieldset": { borderColor: "#d0d7de" },
                                          "&:hover fieldset": { borderColor: "#0969da" },
                                        },
                                      }}
                                    >
                                      {adjustmentnorms?.data.map((it: AdjustmentNormOutputType) => (
                                        <MenuItem key={it._id} value={it._id}>
                                          {it.code}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Box>
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>
                      )}
                    </FieldArray>
                    {/* } */}

                  </Paper>
                ))}
                {scope && <IconButton
                  color="primary"
                  sx={{ display: 'flex', alignItems: 'center' }}
                  onClick={() => {
                    push({
                      _id: undefined,
                      startDate: new Date().toISOString().substring(0, 10),
                      endDate: new Date().toISOString().substring(0, 10),
                      phases: scope ? scope.phases?.map((ph: any) => ({
                        phase: ph.phase?._id ?? "",
                        production: 0,               // CHANGED
                        unit: ph.phase?.name.toLowerCase().includes('khấu than') ? 'tấn' : 'mét',                    // CHANGED
                        assignmentNormCode: "",
                        adjustmentNormCode: "",
                      })) : [],
                    })
                    setVisiable([formik.values.group.length])
                  }}
                >
                  <Add />
                  <Typography>Thêm</Typography>
                </IconButton>}
              </Box>
            )}
          </FieldArray>

          <Divider
            sx={{
              mt: "12px",
              mb: "12px",
              borderColor: "#303030",
              opacity: 0.3,
              borderWidth: "1px",
            }}
          />
        </FormikProvider>
      </DialogContent>

      <DialogActions sx={{ px: 0, gap: "10px" }}>
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
          {selected ? "Cập nhật" : "Xác nhận"}
        </Button>
      </DialogActions>
    </Dialog >
  );
}
