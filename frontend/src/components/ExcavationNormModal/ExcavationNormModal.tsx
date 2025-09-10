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
import CloseIcon from "@mui/icons-material/Close";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FieldArray, FormikProvider, useFormik } from "formik";
import api from "../../config/api.config";
import {
  AssignmentCodeOutputType,
  AssignmentNormInputType,
  AssignmentNormOutputType,
  ExcavationTechType,
  HardnessType,
  PhaseGroupType,
  PhaseOutputType,
  StepType,
} from "../../types";

export default function ExcavationNormModal({
  open,
  setOpen,
  handleSubmit,
  selected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: Partial<AssignmentNormInputType>) => void;
  selected: AssignmentNormOutputType | null;
}) {
  const [phaseGroup, setPhaseGroup] = useState<string | null>(null);
  const [selectedAssignmentCodes, setSelectedAssignmentCodes] = useState<
    AssignmentCodeOutputType[]
  >([]);

  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: async () => api.get("/phasegroups").then((res) => res.data.data),
  });
  const { data: phases = [] } = useQuery({
    queryKey: ["phases", phaseGroup],
    queryFn: async () =>
      api.get(`/phases?phaseGroup=${phaseGroup}`).then((res) => res.data.data),
    enabled: !!phaseGroup,
  });

  const { data: assignmentcodes = [] } = useQuery({
    queryKey: ["assignmentcodes"],
    queryFn: async () =>
      api.get(`/assignmentcodes`).then((res) => res.data.data),
  });
  const { data: steps = [] } = useQuery({
    queryKey: ["steps"],
    queryFn: async () => api.get(`/steps`).then((res) => res.data.data),
  });
  const { data: hardness = [] } = useQuery({
    queryKey: ["hardness"],
    queryFn: async () => api.get(`/hardness`).then((res) => res.data.data),
  });
  const { data: excavationtechs = [] } = useQuery({
    queryKey: ["excavationtechs"],
    queryFn: () => api.get("/excavationtechs").then((res) => res.data.data),
  });

  useEffect(() => {
    setPhaseGroup(
      phasegroups.find(
        (p: PhaseGroupType) => p.name?.toLowerCase() === "đào lò".toLowerCase()
      )?._id
    );
  }, [phasegroups]);

  const formik = useFormik({
    initialValues: {
      phaseGroup: phaseGroup || "",
      phase: selected?.phase?._id || "",
      step: selected?.step?._id || "",
      hardness: selected?.hardness?._id || "",
      code: selected?.code || "",
      excavationTech: selected?.excavationTech?._id || "",
      type: "excavation",
      norms:
        selected?.norms
          ?.filter((item) => item.assignmentCode)
          .map((item) => ({
            assignmentCode: item.assignmentCode._id,
            norm: item.norm,
          })) ||
        assignmentcodes.map((item: any) => ({
          assignmentCode: item._id,
          norm: undefined,
        })),
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      handleSubmit({
        ...values,
        hardness: values.hardness || undefined,
        type: values.type as
          | "excavation"
          | "cutting"
          | "coal_kb"
          | "coal_zh"
          | "coal_zry",
      });
    },
  });

  useEffect(() => {
    if (assignmentcodes.length === 0) return;

    if (selected && selected.norms.length > 0) {
      const selectedCodes = assignmentcodes.filter((ac: any) =>
        selected.norms.some((norm) => norm.assignmentCode?._id === ac._id)
      );
      setSelectedAssignmentCodes(selectedCodes);
    } else {
      setSelectedAssignmentCodes(assignmentcodes);
    }
  }, [selected, assignmentcodes]);

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
          p: "40px",
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
          <Typography>Định mức</Typography>
          <Typography>Đào lò</Typography>
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
            Chỉnh sửa định mức đào lò
          </Typography>
        ) : (
          <Typography
            sx={{ fontSize: "24px", color: "#2B4A82", fontWeight: 400 }}
          >
            Tạo mới định mức đào lò
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <FormikProvider value={formik}>
          <Typography sx={{ fontWeight: 400, fontSize: "14px", mt: "24px" }}>
            Nhóm công đoạn
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.phaseGroup || ""}
              onChange={(event) => {
                setPhaseGroup(event.target.value);
                formik.setFieldValue("phaseGroup", event.target.value);
              }}
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.phaseGroup ? null : (
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
                },
                "& .MuiInputBase-input": {
                  color: formik.values.phaseGroup ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: formik.values.phaseGroup ? "inherit" : "#D9D9D9",
                },
              }}
            >
              {phasegroups
                ?.filter((group: PhaseGroupType | null) => group)
                .map((group: PhaseGroupType) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
            </TextField>
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Công đoạn
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.phase || ""}
              onChange={(event) =>
                formik.setFieldValue("phase", event.target.value)
              }
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.phase ? null : (
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
                },
                "& .MuiInputBase-input": {
                  color: formik.values.phase ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: formik.values.phase ? "inherit" : "#D9D9D9",
                },
              }}
            >
              {phases?.map((phase: PhaseOutputType) => (
                <MenuItem key={phase._id} value={phase._id}>
                  {phase.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Công nghệ xúc
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.excavationTech || ""}
              onChange={(event) =>
                formik.setFieldValue("excavationTech", event.target.value)
              }
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.excavationTech ? null : (
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
                },
                "& .MuiInputBase-input": {
                  color: formik.values.excavationTech
                    ? "inherit"
                    : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: formik.values.excavationTech
                    ? "inherit"
                    : "#D9D9D9",
                },
              }}
            >
              {excavationtechs?.map((excavationtech: ExcavationTechType) => (
                <MenuItem key={excavationtech._id} value={excavationtech._id}>
                  {excavationtech.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Độ cứng */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Độ cứng
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.hardness || ""}
              onChange={(event) =>
                formik.setFieldValue("hardness", event.target.value)
              }
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.hardness ? null : (
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
                },
                "& .MuiInputBase-input": {
                  color: formik.values.hardness ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: formik.values.hardness ? "inherit" : "#D9D9D9",
                },
              }}
            >
              {hardness?.map((item: HardnessType) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Chống
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              select
              value={formik.values.step || ""}
              onChange={(event) =>
                formik.setFieldValue("step", event.target.value)
              }
              variant="outlined"
              InputProps={{
                startAdornment: formik.values.step ? null : (
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
                },
                "& .MuiInputBase-input": {
                  color: formik.values.step ? "inherit" : "transparent",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: formik.values.step ? "inherit" : "#D9D9D9",
                },
              }}
            >
              {steps?.map((step: StepType) => (
                <MenuItem key={step._id} value={step._id}>
                  {step.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Mã định mức */}
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: 2 }}>
            Mã định mức
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <TextField
              value={formik.values.code || ""}
              placeholder="Input Text"
              onChange={(event) =>
                formik.setFieldValue("code", event.target.value)
              }
              variant="outlined"
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                },
                "& input::placeholder": {
                  color: "#000000",
                  opacity: 1,
                },
              }}
            />
          </Box>

          <Divider
            sx={{
              mt: "12px",
              mb: "12px",
              borderColor: "#6592B7",
              opacity: 0.3,
              borderWidth: "1px",
            }}
          />
          <Typography
            sx={{ fontWeight: 500, fontSize: "14px", mb: 1, mt: "12px" }}
          >
            Mã giao khoán
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Autocomplete
              multiple
              options={assignmentcodes.filter(
                (opt: AssignmentCodeOutputType) =>
                  !selectedAssignmentCodes.some(
                    (selected) => selected._id === opt._id
                  )
              )}
              getOptionLabel={(option: AssignmentCodeOutputType) =>
                option.code || ""
              }
              value={selectedAssignmentCodes}
              onChange={(event, newValue) => {
                setSelectedAssignmentCodes(newValue);
                const updatedNorms = newValue.map((item) => {
                  const existing = formik.values.norms.find(
                    (n: any) => n.assignmentCode === item._id
                  );
                  return {
                    assignmentCode: item._id,
                    norm: existing?.norm || undefined,
                  };
                });
                formik.setFieldValue("norms", updatedNorms);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  // placeholder={
                  //   selectedAssignmentCodes.length === 0 ? "Placeholder" : ""
                  // }
                  sx={{ color: "#D9D9D9" }}
                  variant="outlined"
                />
              )}
              sx={{
                width: "700px",
                "& .MuiInputBase-root": {
                  height: "32px",
                  borderRadius: "6px",
                  px: "12px",
                  fontSize: "14px",
                  "& .MuiAutocomplete-input": {
                    padding: "0 !important",
                    lineHeight: "26px",
                    textIndent: "12px",
                  },
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiChip-root": {
                  height: "20px",
                  fontSize: "12px",
                  margin: "2px",
                  lineHeight: "26px",
                  verticalAlign: "middle",
                  transform: "translateY(-6px)",
                },
                "& input::placeholder": {
                  color: "#D9D9D9",
                  opacity: 1,
                  lineHeight: "32px",
                  fontSize: "14px",
                },
              }}
            />
          </Box>
          <FieldArray name="norms">
            {() => (
              <Box
                sx={{
                  mt: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {formik.values.norms.map((item: any, index: number) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", justifyContent: "center" }}
                  >
                    <Grid container spacing={2} sx={{ width: "700px" }}>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Mã giao khoán
                        </Typography>
                        <TextField
                          fullWidth
                          value={
                            assignmentcodes.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id ===
                                formik.values.norms[index].assignmentCode
                            )?.code
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Tên vật tư, tài sản
                        </Typography>
                        <TextField
                          fullWidth
                          value={
                            assignmentcodes.find(
                              (ac: AssignmentCodeOutputType) =>
                                ac._id ===
                                formik.values.norms[index].assignmentCode
                            )?.name
                          }
                          InputLabelProps={{ shrink: true }}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "32px",
                              borderRadius: "6px",
                              px: "12px",
                              fontSize: "14px",
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography
                          sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}
                        >
                          Định mức
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          name={`norms[${index}].norm`}
                          value={formik.values.norms[index]?.norm || ""}
                          onChange={(e) =>
                            formik.setFieldValue(
                              `norms[${index}].norm`,
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
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
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
    </Dialog>
  );
}
