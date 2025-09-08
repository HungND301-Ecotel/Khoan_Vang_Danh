import {
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import * as yup from "yup";
import { FormikProvider, useFormik, FormikErrors } from "formik";
import { useQuery ,useQueries } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  AdjustmentNormOutputType,
  AssignmentNormOutputType,
  MaterialBudgetInputType,
  PhaseGroupType,
  PhaseOutputType,
  PhaseType,
  FormValues
} from "../../types";
import { Divider } from "antd";


const phaseValidationSchema = yup.object({
  phaseGroup: yup.string().required("Nhóm công đoạn không được để trống"),
  phase: yup.string().required("Công đoạn không được để trống"),
  assignmentNormCode: yup.string().required("Mã định mức giao khoán không được để trống"),
  production: yup.number().required("Sản lượng không được để trống"),
  adjustmentNormCode: yup.string().required("Mã hệ số điều chỉnh định mức không được để trống"),
});


const validationSchema = yup.object({
  code: yup.string().required("Mã chi phí không được để trống"),
  phases: yup.array().of(phaseValidationSchema).min(1, "Cần ít nhất một công đoạn"),
});


const usePhases = (phaseGroupId: string) => {
  return useQuery({
    queryKey: ["phases", phaseGroupId],
    queryFn: async () =>
      api.get(`/phases?phaseGroup=${phaseGroupId || ''}`).then((res) => res.data.data),
    enabled: !!phaseGroupId,
  });
};

export default function MaterialBudgetModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<MaterialBudgetInputType>) => void;
  selected: MaterialBudgetInputType | null;
}) {
  const [phaseGroupsForQuery, setPhaseGroupsForQuery] = useState<{[key: number]: string}>({});

  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => api.get("/phasegroups").then((res) => res.data.data),
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

  const formik = useFormik<FormValues>({
    initialValues: {
      code: "",
      phases: [{ phaseGroup: "", phase: "", assignmentNormCode: "", production: undefined, adjustmentNormCode: "" }],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const submitData: Partial<MaterialBudgetInputType> = {
        code: values.code,
        phaseGroup: values.phases[0]?.phaseGroup || "",
        phase: values.phases[0]?.phase || "",
        assignmentNormCode: values.phases[0]?.assignmentNormCode || "",
        production: values.phases[0]?.production,
        adjustmentNormCode: values.phases[0]?.adjustmentNormCode || "",
      };
      handleSubmit(submitData);
    },
  });

  useEffect(() => {
    if (selected) {
      formik.setValues({
        code: selected.code || "",
        phases: [{
          phaseGroup: selected.phaseGroup || "",
          phase: selected.phase || "",
          assignmentNormCode: selected.assignmentNormCode || "",
          production: selected.production,
          adjustmentNormCode: selected.adjustmentNormCode || "",
        }],
      });
      
      if (selected.phaseGroup) {
        setPhaseGroupsForQuery({0: selected.phaseGroup});
      }
    }
  }, [selected]);

  const handleClose = () => {
    formik.resetForm();
    setPhaseGroupsForQuery({});
    setOpen(false);
  };

  const addPhase = () => {
    const newPhases = [...formik.values.phases, { 
      phaseGroup: "", 
      phase: "", 
      assignmentNormCode: "", 
      production: undefined, 
      adjustmentNormCode: "" 
    }];
    formik.setFieldValue("phases", newPhases);
  };

  const removePhase = (index: number) => {
    if (formik.values.phases.length <= 1) return;
    
    const newPhases = formik.values.phases.filter((_, i) => i !== index);
    formik.setFieldValue("phases", newPhases);
    
    const newPhaseGroups = {...phaseGroupsForQuery};
    delete newPhaseGroups[index];
    
    const updatedPhaseGroups: {[key: number]: string} = {};
    Object.entries(newPhaseGroups).forEach(([oldIndex, value]) => {
      const numIndex = parseInt(oldIndex);
      if (numIndex > index) {
        updatedPhaseGroups[numIndex - 1] = value;
      } else {
        updatedPhaseGroups[numIndex] = value;
      }
    });
    
    setPhaseGroupsForQuery(updatedPhaseGroups);
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

  
const phaseQueries = useQueries({
  queries: Object.entries(phaseGroupsForQuery).map(([index, phaseGroupId]) => ({
    queryKey: ["phases", phaseGroupId],
    queryFn: async () =>
      api.get(`/phases?phaseGroup=${phaseGroupId}`).then((res) => res.data.data),
    enabled: !!phaseGroupId,
  })),
});

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: "700px",
          maxHeight: "80vh",
          p: "32px",
          position: "relative",
          borderRadius: "8px",
          boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.15)",
          overflowY: "auto",
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: "20px",
          right: "20px",
          width: "24px",
          height: "24px",
          opacity: 0.7,
          "&:hover": {
            opacity: 1,
          }
        }}
      >
        <CloseIcon sx={{ fontSize: "18px" }} />
      </IconButton>

      <DialogTitle sx={{ p: 0, mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: "12px", color: "#666", mb: 1 }}>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>Thống kê vận hành</Typography>
          <Typography sx={{ fontSize: "12px", color: "#666" }}>Chi phí vật tư kế hoạch</Typography>
        </Breadcrumbs>
        <Divider
          style={{
            margin: "10px 0",
            borderBlockWidth: 1,
            opacity: "30%",
            borderColor: "#6592B7",
          }}
        />
        <Typography sx={{ fontSize: "20px", color: "#2B4A82", fontWeight: 700, mt: 1 }}>
          {selected ? "Chỉnh sửa Chi phí vật tư kế hoạch" : "Tạo mới Chi phí vật tư kế hoạch"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: "14px", mb: 1, color: "#333" }}>
                  Mã chi phí vật tư kế hoạch
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
                      borderRadius: "4px",
                      fontSize: "14px",
                      backgroundColor: "#fff",
                    },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d0d7de",
                        borderWidth: "1px",
                      },
                      "&:hover fieldset": {
                        borderColor: "#0969da",
                      },
                    },
                  }}
                />
              </Box>
              
              {formik.values.phases.map((phase, index) => {
                const phaseData = phaseQueries[index]?.data || [];
                return (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#333" }}>
                        Công đoạn {index + 1}
                      </Typography>
                      {formik.values.phases.length > 1 && (
                        <IconButton 
                          onClick={() => removePhase(index)} 
                          size="small"
                          sx={{ color: '#ff4d4f' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    
                    <Box sx={{ 
                      border: "1px solid #D0D7DE", 
                      borderRadius: "6px", 
                      padding: "16px",
                      backgroundColor: "#fff",
                      mb: 2
                    }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                          Nhóm công đoạn
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={phase.phaseGroup}
                          onChange={(e) => handlePhaseChange(index, "phaseGroup", e.target.value)}
                          error={Boolean(getError(index, "phaseGroup"))}
                          helperText={getError(index, "phaseGroup")}
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
                          {phasegroups?.map((group: PhaseGroupType) => (
                            <MenuItem key={group._id} value={group._id}>
                              {group.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                          Công đoạn
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={phase.phase}
                          onChange={(e) => handlePhaseChange(index, "phase", e.target.value)}
                          error={Boolean(getError(index, "phase"))}
                          helperText={getError(index, "phase")}
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
                          {phaseData.map((phaseItem: PhaseOutputType) => (
                            <MenuItem key={phaseItem._id} value={phaseItem._id}>
                              {phaseItem.name}
                            </MenuItem>
                          ))}
                        </TextField>
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

                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                          Sản lượng
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          placeholder="Input Text"
                          value={phase.production || ''}
                          onChange={(e) => handlePhaseChange(index, "production", e.target.value ? Number(e.target.value) : undefined)}
                          error={Boolean(getError(index, "production"))}
                          helperText={getError(index, "production")}
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
                        />
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: "13px", mb: 1, color: "#666", fontWeight: 500 }}>
                          Mã hệ số điều chỉnh định mức
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={phase.adjustmentNormCode}
                          onChange={(e) => handlePhaseChange(index, "adjustmentNormCode", e.target.value)}
                          error={Boolean(getError(index, "adjustmentNormCode"))}
                          helperText={getError(index, "adjustmentNormCode")}
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
                          {adjustmentnorms?.map((item: AdjustmentNormOutputType) => (
                            <MenuItem key={item._id} value={item._id}>
                              {item.code}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              
              <Box sx={{ mt: -1 }}>
                <Button
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={addPhase}
                  sx={{
                    color: "#2B4A82",
                    fontSize: "14px",
                    fontWeight: 500,
                    textTransform: "none",
                    padding: "4px 0",
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Thêm công đoạn
                </Button>
              </Box>
            </Box>
          </Box>
        </FormikProvider>
      </DialogContent>

      <DialogActions sx={{ mt: 4, px: 0, gap: "12px", justifyContent: "flex-end" }}>
        <Button
          onClick={handleClose}
          sx={{
            backgroundColor: "#f6f8fa",
            color: "#24292f",
            border: "1px solid #d0d7de",
            borderRadius: "6px",
            height: "36px",
            minWidth: "80px",
            fontSize: "14px",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "#f3f4f6",
            },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={() => formik.submitForm()}
          variant="contained"
          sx={{
            backgroundColor: "#2B4A82",
            borderRadius: "6px",
            height: "36px",
            minWidth: "100px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1E3A8A",
            },
          }}
        >
          {selected ? "Cập nhật" : "Xác nhận"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}



