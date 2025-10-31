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
  MaterialBudgetOutputType,
  PhaseGroupType,
  PhaseOutputType,
  PhaseType,
} from "../../types";
import { CircleX } from "lucide-react";

export default function MaterialCostUsedModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialCostUsedInputType>) => void;
  selected: MaterialCostUsedOutputType | null;
}) {
  const [phaseGroupsForQuery, setPhaseGroupsForQuery] = useState<{ [key: number]: string }>({});
  const [selectedMaterials, setSelectedMaterials] = useState<Materials[]>([]);

  const { data: productionscopes = [] } = useQuery({
    queryKey: ["productionscopes"],
    queryFn: async () =>
      api.get("/productionscopes").then((res) => res.data.data),
  });
  const { data: phaseGroups = [] } = useQuery({
    queryKey: ["phaseGroups"],
    queryFn: async () =>
      api.get("/phaseGroups").then((res) => res.data.data),
  });
  const { data: materialassignments = [] } = useQuery({
    queryKey: ["materialassignments"],
    queryFn: async () =>
      api.get("/materialassignments/getAll").then((res) => res.data.data),
  });
  const { data: materialbudgets = [] } = useQuery({
    queryKey: ["materialbudgets"],
    queryFn: async () =>
      api.get("/materialbudgets").then((res) => res.data.data),
  });
  const { data: assignmentnorms = [] } = useQuery({
      queryKey: ["assignmentnorms"],
      queryFn: async () =>
        api.get("/assignmentnorms").then((res) => res.data.data),
    });
  
    const { data: adjustmentnorms = [] } = useQuery({
      queryKey: ["adjustmentnorms"],
      queryFn: async () =>
        api.get("/adjustmentnorms").then((res) => res.data.data),
    });

  // Initial values
  const formik = useFormik({
    initialValues: {
      code: selected?.code || "",
      materialBudgetCode: selected?.materialBudget?._id
        ? String(selected.materialBudget._id)
        : "",
      assignmentNormCode: "",
      productionScope: selected?.productionScope?._id
        ? String(selected.productionScope._id)
        : "",
      phases: (selected?.phases || []).map((p: any) => ({
        phase: p.phase?._id ? String(p.phase._id) : "",
        production: p.production
      })),
      materials:
        selected?.materials?.map((item) => ({
          material: item.material?._id ? String(item.material._id) : "",
          quantity: item.quantity,
        })) ||
        materialassignments.map((item: Materials) => ({
          material: item._id ? String(item._id) : "",
          quantity: undefined,
        })),
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      console.log(values)
      handleSubmit(values);
    },
  });

  useEffect(() => {
    if (materialassignments.length === 0) return;

    if (selected && selected.materials.length > 0) {
      const selectedCodes = materialassignments.filter((ac: Materials) =>
        selected.materials.some((material) => material.material?._id === ac._id)
      );
      setSelectedMaterials(selectedCodes);
    } else {
      setSelectedMaterials(materialassignments);
    }
  }, [selected, materialassignments]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  const handlePhaseChange = (index: number, field: keyof PhaseType, value: any) => {
      const newPhases = [...formik.values.phases];
      newPhases[index] = { ...newPhases[index], [field]: value };
  
      if (field === "phaseGroup") {
        newPhases[index].phase = "";
  
        setPhaseGroupsForQuery({
          ...phaseGroupsForQuery,
          [index]: value
        });
      }
  
      formik.setFieldValue("phases", newPhases);
    };

    const getError = (index: number, field: keyof PhaseType): string => {
        const error = formik.errors.phases?.[index] as FormikErrors<PhaseType> | undefined;
        const touched = formik.touched.phases?.[index] as Record<keyof PhaseType, boolean> | undefined;
    
        if (touched?.[field] && error?.[field]) {
          return error[field] as string;
        }
        return "";
      };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: "800px",
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
          <Typography sx={{ fontWeight: 400, fontSize: "14px", mt: "24px" }}>
            Mã chi phí vật tư thực hiện
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              value={formik.values.code}
              placeholder="Input Text"
              onChange={(e) => formik.setFieldValue("code", e.target.value)}
              variant="outlined"
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.code ? "#F2F2F2" : "#FFFFFF",
                },
                "& input::placeholder": {
                  color: "#000000",
                  opacity: 1,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
              }}
            />
          </Box>

          {/* Mã diện sản xuất */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Mã diện sản xuất
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.productionScope || ""}
              onChange={(event) => {
                const scopeId = event.target.value;
                formik.setFieldValue("productionScope", scopeId);

                const scope = productionscopes.find(
                  (ps: ProductionScopeOutputType) => ps._id === scopeId
                );

                // nếu scope có mảng phases thì map ra
                if (scope && Array.isArray(scope.phases)) {
                  const mappedPhases = scope.phases.map((ph: any) => ({
                    phase: ph.phase?._id,     // gán _id phase
                    production: "",    // hoặc gán mặc định rỗng / số lượng sản xuất
                  }));
                  formik.setFieldValue("phases", mappedPhases);
                } else {
                  formik.setFieldValue("phases", []);
                }
              }}
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.productionScope ? null : (
                  <InputAdornment
                    position="start"
                    sx={{ color: "#D9D9D9", ml: "12px" }}
                  >
                    Placeholder
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor: formik.values.productionScope
                    ? "#F2F2F2"
                    : "#FFFFFF",
                },
                "& .MuiInputBase-input": {
                  color: formik.values.productionScope
                    ? "inherit"
                    : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
              }}
            >
              {productionscopes?.map((item: ProductionScopeOutputType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.code}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <FieldArray name="phases">
            {({ push, remove }) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {formik.values.phases.map((item: any, index: number) => {
                  const phase = phaseGroups.find(
                    (pg: PhaseOutputType) => pg._id === item.phase
                  );

                  return (
                    <Box
                      key={index}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: 1.5,
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      {/* Mã công đoạn */}
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
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
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
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
                      {/* Tên công đoạn */}
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
                        >
                          Sản lượng
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          name={`phases[${index}].production`}
                          value={formik.values.phases[index]?.production || ""}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `phases[${index}].production`,
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
                              backgroundColor: formik.values.materials[index]
                                ?.quantity
                                ? "#F2F2F2"
                                : "#FFFFFF",
                            },
                            "& input::placeholder": {
                              color: "#9D9D9D",
                              opacity: 1,
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
                            },
                          }}
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                          Mã định mức giao khoán
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={phase.assignmentNormCode}
                          onChange={(e) => handlePhaseChange(index, "assignmentNormCode", e.target.value)}
                          error={Boolean(getError(index, "assignmentNormCode"))}
                          helperText={getError(index, "assignmentNormCode")}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "40px",
                              borderRadius: "4px",
                              fontSize: "14px",
                              backgroundColor: "#fff",
                            },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": {
                                borderColor: "#d0d7de",
                              },
                              "&:hover fieldset": {
                                borderColor: "#0969da",
                              },
                            },
                          }}
                        >
                          {assignmentnorms?.map((item: AssignmentNormOutputType) => (
                            <MenuItem key={item._id} value={item._id}>
                              {item.code}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                  );
                })}
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
          <Typography
            sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: "12px" }}
          >
            Vật tư, tài sản
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Autocomplete
              multiple
              options={materialassignments.filter(
                (opt: Materials) =>
                  !selectedMaterials.some(
                    (selected) => selected._id === opt._id
                  )
              )}
              getOptionLabel={(option: Materials) => option.code || ""}
              value={selectedMaterials}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              onChange={(event, newValue) => {
                setSelectedMaterials(newValue);
                const updatedNorms = newValue.map((item) => {
                  const existing = formik.values.materials.find(
                    (n: any) => n.material === item._id
                  );
                  return {
                    material: item._id,
                    quantity: existing?.norm || undefined,
                  };
                });
                formik.setFieldValue("materials", updatedNorms);
              }}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" />
              )}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  minHeight: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  backgroundColor:
                    selectedMaterials.length > 0 ? "#F2F2F2" : "#FFFFFF",
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
                "& .MuiAutocomplete-input": {
                  padding: "0 !important",
                  lineHeight: "20px", 
                },
                "& input::placeholder": {
                  color: "#D9D9D9",
                  opacity: 1,
                  fontSize: "14px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D9D9D9",
                },
              }}
            />
          </Box>

          {/* Danh sách materials */}
          {/* Danh sách materials */}
          <FieldArray name="materials">
            {() => (
              <Box
                sx={{
                  mt: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {formik.values.materials.map((item: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-end",
                    }}
                  >
                    <Grid container spacing={2} sx={{ width: "700px" }}>
                      {/* Mã vật tư */}
                      <Grid item xs={12} sm={3}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Mã vật tư
                        </Typography>
                        <TextField
                          fullWidth
                          value={
                            materialassignments.find(
                              (ac: Materials) =>
                                ac._id === formik.values.materials[index].material
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
                      <Grid item xs={12} sm={5}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Tên vật tư, tài sản
                        </Typography>
                        <TextField
                          fullWidth
                          value={
                            materialassignments.find(
                              (ac: Materials) =>
                                ac._id === formik.values.materials[index].material
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
                      <Grid item xs={12} sm={4}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Số lượng
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          name={`materials[${index}].quantity`}
                          value={formik.values.materials[index]?.quantity || ""}
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
                              backgroundColor: formik.values.materials[index]
                                ?.quantity
                                ? "#F2F2F2"
                                : "#FFFFFF",
                            },
                            "& input::placeholder": {
                              color: "#9D9D9D",
                              opacity: 1,
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
                            },
                          }}
                        />
                      </Grid>

                      {/* Mã định mức giao khoán */}
                      <Grid item xs={12} sm={6}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Mã định mức giao khoán
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={formik.values.materials[index]?.assignmentNormCode || ""}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `materials[${index}].assignmentNormCode`,
                              e.target.value
                            )
                          }
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                              backgroundColor: "#FFFFFF",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
                            },
                          }}
                        >
                          {assignmentnorms.map((item: any) => (
                            <MenuItem key={item._id} value={item._id}>
                              {item.code}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Mã hệ số điều chỉnh định mức */}
                      <Grid item xs={12} sm={6}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Mã hệ số điều chỉnh định mức
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={
                            formik.values.materials[index]?.adjustmentNormCode || ""
                          }
                          onChange={(e) =>
                            formik.setFieldValue(
                              `materials[${index}].adjustmentNormCode`,
                              e.target.value
                            )
                          }
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                              backgroundColor: "#FFFFFF",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D9D9D9",
                            },
                          }}
                        >
                          {adjustmentnorms.map((item: any) => (
                            <MenuItem key={item._id} value={item._id}>
                              {item.code}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>

                    {/* Nút X */}
                    <IconButton
                      onClick={() => {
                        const materialToRemove = materialassignments.find(
                          (ac: Materials) =>
                            ac._id === formik.values.materials[index].material
                        );
                        if (materialToRemove) {
                          setSelectedMaterials((prev) =>
                            prev.filter(
                              (material) => material._id !== materialToRemove._id
                            )
                          );
                        }

                        const updatedMaterials = formik.values.materials.filter(
                          (_: any, i: number) => i !== index
                        );
                        formik.setFieldValue("materials", updatedMaterials);
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
    </Dialog >
  );
}