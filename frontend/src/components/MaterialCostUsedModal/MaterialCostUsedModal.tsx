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
  MaterialCostUsedOutputType,
  ProductionScopeOutputType,
  AssignmentNormOutputType,
  Materials,
  AdjustmentNormOutputType,
  MaterialBudgetOutputType,
  PhaseOutputType,
  PhaseType,
  MaterialAssignmentOutputType,
} from "../../types";
import { CircleX } from "lucide-react";
import { Add, Delete } from "@mui/icons-material";
import dayjs from "dayjs";

export default function MaterialCostUsedModal({
  open,
  setOpen,
  handleSubmit,
  selected,
  deleteMutation
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialCostUsedInputType>) => void;
  selected: MaterialCostUsedOutputType | null;
  deleteMutation: (ids: string[]) => void
}) {
  const [phaseGroupsForQuery, setPhaseGroupsForQuery] = useState<{ [key: number]: string }>({});
  // const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null)

  const [deletedIds, setDeletedIds] = useState<string[]>([])


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
  const { data: materialassignments = { data: [] } } = useQuery({
    queryKey: ["materialassignments"],
    queryFn: async () =>
      api.get("/materialassignments").then((res) => res.data.data),
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
      groupIndexes: [],
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
        selectedMaterials: (materialassignments.data || []).filter((m: Materials) => {
          return g?.materials?.some(group => // Duyệt qua các nhóm vật liệu bên trong g
            group.materials.some((i: any) => // Duyệt qua các vật liệu thực tế bên trong nhóm đó
              i.material?._id === m._id // Kiểm tra xem ID của vật liệu (m._id) có khớp không
            )
          ) || false // Nếu không tìm thấy, loại bỏ (false)
        }),
        materials:
          g?.materials?.flatMap(group =>
            group.materials.map(mat => ({
              material: mat.material?._id ? String(mat.material._id) : "",
              quantity: mat.quantity
            }))) || []
      })),
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Đóng gói payload đảm bảo phases luôn có unit
      const payload: Partial<MaterialCostUsedInputType>[] = values.group.map((v) => ({
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
        materials: (v.materials || []).map((m: any) => ({
          material: m.material ?? "",
          quantity: Number(m.quantity ?? 0),
        })) as any,

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

  const { data: initialplannedcost } = useQuery({
    queryKey: ["initialplannedcosts", formik.values.productionScope],
    queryFn: async () =>
      api.get(`/initialplannedcosts/getOne/${formik.values.productionScope}`).then((res) => {
        if (selected) {
          formik.setFieldValue('groupIndexes', res.data.data?.group.filter((i: any) => {
            return selected?.group?.some(g => g.startDate === i.startDate && g.endDate === i.endDate) || false
          }))
        }
        return res.data.data
      }),
    enabled: !!formik.values.productionScope
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

  const updateGroupsFromSelectedIndexes = (selectedGroups: any[]) => {
    const oldGroups = formik.values.group || [];

    const mapped = selectedGroups.map((g: any, index: number) => {
      const old = oldGroups[index]; // lấy dữ liệu cũ nếu có

      return {
        startDate: g.startDate.substring(0, 10),
        endDate: g.endDate.substring(0, 10),

        phases: g.phases.map((ph: any, phIndex: number) => {
          const oldPhase = old?.phases?.[phIndex];

          return {
            phase: ph.phase?._id ?? oldPhase?.phase ?? "",
            production: oldPhase?.production ?? 0,
            unit:
              ph.unit ??
              oldPhase?.unit ??
              (ph.phase?.name.toLowerCase().includes("khấu than") ? "tấn" : "mét"),
            assignmentNormCode:
              ph.assignmentNormCode?._id ??
              oldPhase?.assignmentNormCode ??
              "",
            adjustmentNormCode:
              ph.adjustmentNormCode?._id ??
              oldPhase?.adjustmentNormCode ??
              "",
          };
        }),

        selectedMaterials: old?.selectedMaterials ?? [],
        materials: old?.materials ?? [],
      };
    });

    formik.setFieldValue("group", mapped);
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
          <Typography>Chi phí vật tư thực hiện</Typography>
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
            Chỉnh sửa Chi phí thực hiện
          </Typography>
        ) : (
          <Typography
            sx={{ fontSize: "24px", color: "#2B4A82", fontWeight: 400 }}
          >
            Tạo mới Chi phí thực hiện
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
              value={formik.values.productionScope || null}
              onChange={(event) => {
                const scopeId = event.target.value;
                formik.setFieldValue("productionScope", scopeId);
              }}
              variant="outlined"
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
                backgroundColor: 'white',
              }}
            >
              {productionscopes?.data.map((item: ProductionScopeOutputType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.code}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          {initialplannedcost && <Box>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
              Chọn thời gian
            </Typography>
            <Autocomplete
              multiple
              fullWidth
              options={initialplannedcost?.group || []}
              getOptionLabel={(g: any) =>
                `${dayjs(g.startDate).format("DD/MM/YYYY")} → ${dayjs(g.endDate).format("DD/MM/YYYY")}`
              }
              value={formik.values.groupIndexes || []}
              onChange={(event, newValue) => {
                formik.setFieldValue("groupIndexes", newValue);
                updateGroupsFromSelectedIndexes(newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Chọn mốc thời gian" placeholder="Chọn..." sx={{ background: 'white' }} />
              )}
            />
          </Box>}
          <FieldArray name="group">
            {({ push, remove }) => (
              <Box sx={{ mt: 1 }}>
                {formik.values.group.map((g: any, indexParent: number) => (
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
                          disabled
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
                          disabled
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
                              if (g._id) {
                                setDeletedIds([...deletedIds, g._id])
                                const updated = formik.values.groupIndexes.filter((i: any) => i._id === g._id)
                                formik.setFieldValue(`group[${indexParent}].groupIndexes`, updated)
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
                    <FieldArray name="phases">
                      {() => (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
                          {formik.values.group[indexParent].phases.map((p: any, index: number) => {
                            const phase = phaseGroups.data.find(
                              (pg: PhaseOutputType) => pg._id === p.phase
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
                                      value={formik.values.group[indexParent].phases[index]?.production ?? 0}
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          `group[${indexParent}].phases[${index}].production`,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Placeholder"
                                      variant="outlined"

                                      sx={{
                                        "& .MuiInputBase-root": {
                                          height: "32px",
                                          borderRadius: "6px",
                                          px: "12px",
                                          fontSize: "14px",
                                        },
                                        background: 'white'
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
                                      type="text"
                                      disabled                                 // CHANGED
                                      name={`group[${indexParent}].phases[${index}].unit`}                 // CHANGED
                                      value={formik.values.group[indexParent].phases[index]?.unit}
                                      onChange={(e) =>
                                        formik.setFieldValue(
                                          `group[${indexParent}].phases[${index}].unit`,
                                          e.target.value
                                        )
                                      }
                                      placeholder="VD: mét, tấn ..."
                                      variant="outlined"
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
                                      disabled
                                      value={p.assignmentNormCode || ""}
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
                                      disabled
                                      value={p.adjustmentNormCode || ""}
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

                    {/* Chọn vật tư */}
                    <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: "12px" }}>
                      Vật tư, tài sản
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Autocomplete
                        multiple
                        fullWidth
                        options={materialassignments.data.filter(
                          (opt: Materials) =>
                            !formik.values.group[indexParent]?.selectedMaterials?.some((selected: Materials) => selected._id === opt._id)
                        )}
                        getOptionLabel={(option: Materials) => option.code || ""}
                        value={formik.values.group[indexParent].selectedMaterials}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        onChange={(event, newValue) => {
                          // setSelectedMaterials(newValue);
                          const updated = newValue.map((item) => {
                            const existing = (formik.values.group[indexParent].materials || []).find(
                              (n: any) => n.material === item._id
                            );
                            return {
                              material: item._id,
                              quantity: existing?.quantity ?? undefined,   // CHANGED (fix nhầm norm)
                            };
                          });
                          formik.setFieldValue(`group[${indexParent}].materials`, updated);
                          formik.setFieldValue(`group[${indexParent}].selectedMaterials`, newValue);
                        }}
                        renderInput={(params) => <TextField {...params} variant="outlined" size="small" />}
                        sx={{
                          "& .MuiInputBase-root": {
                            minHeight: "32px",
                            borderRadius: "6px",
                            px: "12px",
                            fontSize: "14px",
                            backgroundColor:
                              formik.values.group[indexParent]?.selectedMaterials?.length > 0 ? "#F2F2F2" : "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                          },
                          "& .MuiChip-root": {
                            height: "20px",
                            fontSize: "12px",
                            margin: "2px",
                            lineHeight: "20px",
                            verticalAlign: "middle",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#D9D9D9",
                          },
                        }}
                      />
                    </Box>

                    {/* Danh sách materials */}
                    <FieldArray name="materials">
                      {() => (
                        <Box
                          sx={{
                            mt: "12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            p: 2
                          }}
                        >
                          {formik.values.group[indexParent]?.materials?.map((m: any, index: number) => (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "flex-end",
                              }}
                            >
                              <Grid container spacing={2}>
                                {/* Mã vật tư */}
                                <Grid item xs={12} sm={3}>
                                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                                    Mã vật tư
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={
                                      materialassignments.data.find(
                                        (ac: Materials) =>
                                          ac._id === formik.values.group[indexParent]?.materials[index]?.material
                                      )?.code || ""
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    variant="outlined"
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        height: "32px",
                                        borderRadius: "6px",
                                        px: "12px",
                                        fontSize: "14px",
                                        backgroundColor: "#F2F2F2",
                                      },
                                      "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#D9D9D9",
                                      },
                                    }}
                                  />
                                </Grid>

                                {/* Tên vật tư */}
                                <Grid item xs={12} sm={4}>
                                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                                    Tên vật tư, tài sản
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={
                                      materialassignments.data.find(
                                        (ac: Materials) =>
                                          ac._id === formik.values.group[indexParent]?.materials[index]?.material
                                      )?.name || ""
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    variant="outlined"
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        height: "32px",
                                        borderRadius: "6px",
                                        px: "12px",
                                        fontSize: "14px",
                                        backgroundColor: "#F2F2F2",
                                      },
                                      "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#D9D9D9",
                                      },
                                    }}
                                  />
                                </Grid>

                                {/* Số lượng */}
                                <Grid item xs={12} sm={3}>
                                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                                    Số lượng
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    name={`group[${indexParent}].materials[${index}].quantity`}
                                    value={formik.values.group[indexParent]?.materials[index]?.quantity ?? ""}
                                    onChange={(e) =>
                                      formik.setFieldValue(
                                        `group[${indexParent}].materials[${index}].quantity`,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Placeholder"
                                    variant="outlined"
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        height: "32px",
                                        borderRadius: "6px",
                                        px: "12px",
                                        fontSize: "14px",
                                        backgroundColor: 'white',
                                      },
                                    }}
                                  />
                                </Grid>
                                {/* Số lượng */}
                                <Grid item xs={12} sm={2}>
                                  <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
                                    Đơn vị tính
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    disabled
                                    size="small"
                                    value={materialassignments.data.find(
                                      (ac: Materials) =>
                                        ac._id === formik.values.group[indexParent]?.materials[index]?.material
                                    )?.uom?.name || ""}
                                    placeholder="Placeholder"
                                    variant="outlined"
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
                                </Grid>
                              </Grid>

                              {/* Nút X */}
                              <IconButton
                                onClick={() => {
                                  const materialToRemove = materialassignments.data.find(
                                    (ac: Materials) =>
                                      ac._id === formik.values.group[indexParent].materials[index].material
                                  );
                                  if (materialToRemove) {
                                    const updatedSelectedMaterials = formik.values.group[indexParent]?.selectedMaterials.filter(
                                      (s: any, i: number) => s._id !== materialToRemove._id
                                    );
                                    formik.setFieldValue(`group[${indexParent}].selectedMaterials`, updatedSelectedMaterials);
                                  }

                                  const updatedMaterials = formik.values.group[indexParent]?.materials.filter(
                                    (s: any, i: number) => s.material !== materialToRemove._id
                                  );
                                  formik.setFieldValue(`group[${indexParent}].materials`, updatedMaterials);
                                }}
                                sx={{
                                  width: "24px",
                                  height: "24px",
                                  ml: 1,
                                  p: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "transparent",
                                  "&:hover": {
                                    backgroundColor: "transparent",
                                    opacity: 0.7,
                                  },
                                }}
                              >
                                <CircleX size={24} strokeWidth={1} color="#757575" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </FieldArray>
                  </Paper>
                ))}
              </Box>
            )}
          </FieldArray>

          <Divider
            sx={{
              mt: "12px",
              mb: "12px",
              borderColor: "#6592B7",
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
    </Dialog>
  );
}
