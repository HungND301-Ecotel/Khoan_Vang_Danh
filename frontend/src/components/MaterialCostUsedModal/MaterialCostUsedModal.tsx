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
import { FieldArray, FormikProvider, useFormik, FormikErrors, FormikTouched } from "formik";
import api from "../../config/api.config";
import {
  MaterialCostUsedInputType,
  MaterialCostUsedOutputType,
  ProductionScopeOutputType,
  Materials,
  PhaseOutputType,
  PhaseType,
  InitialPlannedCostOutputType,
} from "../../types";
import { CircleX } from "lucide-react";
import { Add, Delete } from "@mui/icons-material";
import dayjs from "dayjs";
import FieldMonthYear from "../../ui/FieldMonth_Year";

export default function MaterialCostUsedModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialCostUsedInputType>) => void;
  selected: any | null;
}) {
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

  // Initial values
  const formik = useFormik({
    initialValues: {
      productionScope: selected?.productionScope?._id
        ? String(selected.productionScope._id)
        : "",
      groupIndexes: null,
      month: selected?.month ? dayjs(selected?.month).format('YYYY-MM') : "",
      phases: (selected?.phases || selected?.productionScope?.phases || []).map((p: any) => ({
        phase: p.phase?._id ? String(p.phase._id) : "",
        production: Number(p.production ?? 0),                 // CHANGED
        unit: p.phase?.unit ?? (p.phase?.name?.toLowerCase()?.includes('khấu than') ? 'tấn' : 'mét'),
        assignmentNormCode: p?.assignmentNormCode,
        adjustmentNormCode: p?.adjustmentNormCode,
      })),
      selectedMaterials: (materialassignments.data || []).filter((m: Materials) => {
        return selected?.materials?.some((group: any) => // Duyệt qua các nhóm vật liệu bên trong g
          group.materials.some((i: any) => // Duyệt qua các vật liệu thực tế bên trong nhóm đó
            i.material?._id === m._id // Kiểm tra xem ID của vật liệu (m._id) có khớp không
          )
        ) || false // Nếu không tìm thấy, loại bỏ (false)
      }),
      materials:
        selected?.materials?.flatMap((group: any) =>
          group.materials.map((mat: any) => ({
            material: mat.material?._id ? String(mat.material._id) : "",
            quantity: mat.quantity
          }))) || []
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Đóng gói payload đảm bảo phases luôn có unit
      const payload: Partial<MaterialCostUsedInputType> = {
        _id: selected?._id,
        productionScope: values?.productionScope,
        month: dayjs(new Date(values.month)).format('YYYY-MM'),
        phases: (values.phases || []).map((p: any) => ({
          phase: p.phase ?? "",
          production: Number(p.production ?? 0),
          unit: String(p.unit ?? ""),
          assignmentNormCode: p.assignmentNormCode,
          adjustmentNormCode: p.adjustmentNormCode,
        })),
        materials: (values.materials || []).map((m: any) => ({
          material: m.material ?? "",
          quantity: Number(m.quantity ?? 0),
        })) as any,

      }
      handleSubmit(payload);
    }

  })


  const { data: initialplannedcost } = useQuery({
    queryKey: ["initialplannedcost", formik.values.productionScope, open],
    queryFn: async () => {
      const res = await api.get(`/initialplannedcosts/getOne/${formik.values.productionScope}`);
      return res.data.data;
    },
    enabled: !!formik.values.productionScope,
  });
  useEffect(() => {
    if (initialplannedcost && selected) {
      const group = initialplannedcost?.group?.find((i: any) =>
        selected.month === i.month
      );
      formik.setFieldValue("groupIndexes", group);
    }
  }, [initialplannedcost, selected]);



  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };


  const getError = (index: number, field: keyof PhaseType): string => {

    const phasesErrors = formik.errors.phases as FormikErrors<PhaseType>[] | undefined;
    const error = phasesErrors?.[index];

    const phasesTouched = formik.touched.phases as FormikTouched<PhaseType>[] | undefined;

    const touched = phasesTouched?.[index];

    // 3. Kiểm tra và trả về lỗi
    if (touched?.[field] && error?.[field]) {
      return error[field] as string;
    }
    return "";
  };

  const updateGroupsFromSelectedIndexes = (selected: any) => {
    const mapped = (selected.phases || []).map((g: any, index: number) => {
      return {
        phase: g.phase?._id || "",
        production: 0,
        unit:
          g.unit ??
          (g.phase?.name.toLowerCase().includes("khấu than") ? "tấn" : "mét"),
        assignmentNormCode: g.assignmentNormCode?._id,
        adjustmentNormCode: g.adjustmentNormCode?._id,
      };
    })
    formik.setFieldValue("month", selected.month ? dayjs(selected.month).format("YYYY-MM") : "")
    formik.setFieldValue("phases", mapped)
  }
  console.log(formik.values);


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
          {initialplannedcost &&
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
                Chọn thời gian
              </Typography>
              <Autocomplete
                fullWidth
                options={initialplannedcost?.group || []}
                getOptionLabel={(g: any) =>
                  `${dayjs(g.month).format("MM/YYYY")}`
                }
                value={formik.values.groupIndexes || null}
                onChange={(event, newValue) => {
                  formik.setFieldValue("groupIndexes", newValue);
                  updateGroupsFromSelectedIndexes(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Chọn thời gian" placeholder="Chọn..." sx={{ background: 'white' }} />
                )}
              />
            </Box>}
          {formik.values.groupIndexes && <Box sx={{ mt: 1 }}>
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
              <FieldMonthYear formik={formik}/>

              {/* {visiable.some(i => i === indexParent) && */}
              <FieldArray name="phases">
                {() => (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
                    {formik.values.phases.map((item: any, index: number) => {
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
                                name={`phases[${index}].production`}
                                value={formik.values.phases[index]?.production ?? 0}
                                onChange={(e) =>
                                  formik.setFieldValue(
                                    `phases[${index}].production`,
                                    e.target.value
                                  )
                                }
                                placeholder="Placeholder"
                                variant="outlined"
                                error={Boolean(getError(index, "production"))}
                                helperText={getError(index, "production")}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: "32px",
                                    borderRadius: "6px",
                                    px: "12px",
                                    fontSize: "14px",
                                    background: "white"
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
                                name={`phases[${index}].unit`}                 // CHANGED
                                value={formik.values.phases[index]?.unit}
                                onChange={(e) =>
                                  formik.setFieldValue(
                                    `phases[${index}].unit`,
                                    e.target.value
                                  )
                                }
                                placeholder="VD: mét, tấn ..."
                                variant="outlined"
                                error={Boolean(getError(index, "unit"))}
                                helperText={getError(index, "unit")}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: "32px",
                                    borderRadius: "6px",
                                    px: "12px",
                                    fontSize: "14px",
                                    background: "white"
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#D9D9D9",
                                  },
                                }}
                              />
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
                      !formik.values.selectedMaterials?.some((selected: Materials) => selected._id === opt._id)
                  )}
                  getOptionLabel={(option: Materials) => option.code || ""}
                  value={formik.values.selectedMaterials}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  onChange={(event, newValue) => {
                    // setSelectedMaterials(newValue);
                    const updated = newValue.map((item) => {
                      const existing = (formik.values.materials || []).find(
                        (n: any) => n.material === item._id
                      );
                      return {
                        material: item._id,
                        quantity: existing?.quantity ?? undefined,   // CHANGED (fix nhầm norm)
                      };
                    });
                    formik.setFieldValue(`materials`, updated);
                    formik.setFieldValue(`selectedMaterials`, newValue);
                  }}
                  renderInput={(params) => <TextField {...params} variant="outlined" size="small" />}
                  sx={{
                    "& .MuiInputBase-root": {
                      minHeight: "32px",
                      borderRadius: "6px",
                      px: "12px",
                      fontSize: "14px",
                      backgroundColor:
                        formik.values.selectedMaterials?.length > 0 ? "#F2F2F2" : "#FFFFFF",
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
                    {formik.values.materials?.map((m: any, index: number) => (
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
                                    ac._id === formik.values.materials[index]?.material
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
                                    ac._id === formik.values.materials[index]?.material
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
                              name={`materials[${index}].quantity`}
                              value={formik.values.materials[index]?.quantity ?? ""}
                              onChange={(e) =>
                                formik.setFieldValue(
                                  `materials[${index}].quantity`,
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
                                  ac._id === formik.values.materials[index]?.material
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
                                ac._id === formik.values.materials[index].material
                            );
                            if (materialToRemove) {
                              const updatedSelectedMaterials = formik.values.selectedMaterials.filter(
                                (s: any, i: number) => s._id !== materialToRemove._id
                              );
                              formik.setFieldValue(`selectedMaterials`, updatedSelectedMaterials);
                            }

                            const updatedMaterials = formik.values.materials.filter(
                              (s: any, i: number) => s.material !== materialToRemove._id
                            );
                            formik.setFieldValue(`materials`, updatedMaterials);
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
          </Box>}

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
