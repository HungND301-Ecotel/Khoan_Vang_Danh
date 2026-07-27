import {
  Box,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FieldArray } from "formik";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import FieldInput from "../../../components/TextField/FieldInput";

interface PhaseSectionProps {
  formik: any;
  gIdx: number;
  phasesData: any[];
  assignmentnormsData: any[];
  adjustmentnormsData: any[];
  getError: (gIdx: number, pIdx: number, field: string) => string;
}

export default function PhaseSection({
  formik,
  gIdx,
  phasesData,
  assignmentnormsData,
  adjustmentnormsData,
  getError,
}: PhaseSectionProps) {
  const phases = formik.values.groups[gIdx]?.phases || [];

  return (
    <FieldArray name={`groups.${gIdx}.phases`}>
      {({ remove: removePhase }) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 2,
          }}
        >
          {phases.length === 0 && (
            <Typography
              sx={{
                fontSize: "13px",
                color: "text.secondary",
                textAlign: "center",
                py: 1,
              }}
            >
              Chưa có công đoạn. Nhấn <strong>+</strong> để thêm.
            </Typography>
          )}
          {phases.map((item: any, pIdx: number) => {
            return (
              <Paper
                key={pIdx}
                elevation={0}
                sx={{
                  border: "1px dashed #d0d7de",
                  p: 2,
                  position: "relative",
                }}
              >
                {/* Label + nút xóa */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Công đoạn {pIdx + 1}
                  </Typography>
                  {pIdx > 0 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removePhase(pIdx)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                      md: "1fr 1fr 1fr 1fr",
                    },
                    gap: 1.5,
                    mt: 1,
                  }}
                >
                  {/* Dropdown chọn công đoạn (span 2 cột) */}
                  <Box sx={{ gridColumn: "span 2" }}>
                    <Typography sx={{ fontSize: "12px", mb: 0.5 }}>
                      Chọn công đoạn
                    </Typography>
                    <FieldAutoCompleted
                      formik={formik}
                      field={`groups.${gIdx}.phases.${pIdx}.phase`}
                      title=""
                      labelkey="code"
                      data={phasesData}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "12px", mb: 0.5 }}>
                      Sản lượng
                    </Typography>
                    <TextFieldNumber
                      formik={formik}
                      field={`groups.${gIdx}.phases.${pIdx}.production`}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "12px", mb: 0.5 }}>
                      ĐVT
                    </Typography>
                    <FieldInput
                      formik={formik}
                      field={`groups.${gIdx}.phases.${pIdx}.unit`}
                      title=""
                    />
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography sx={{ fontSize: "12px", mb: 0.5 }}>
                      Định mức giao khoán
                    </Typography>
                    <FieldAutoCompleted
                      formik={formik}
                      field={`groups.${gIdx}.phases.${pIdx}.assignmentNormCode`}
                      title=""
                      labelkey="code"
                      data={assignmentnormsData}
                      onChange={(newValue: any) => {
                        if (newValue && newValue.norms) {
                          const adjustmentNormCode =
                            formik.values.groups[gIdx].phases[pIdx]
                              .adjustmentNormCode;
                          const adjustmentDoc = adjustmentnormsData.find(
                            (a: any) => a._id === adjustmentNormCode,
                          );

                          const codes = newValue.norms.map((n: any) => {
                            const adjNorm = adjustmentDoc?.norms?.find(
                              (an: any) =>
                                (an.assignmentCode?._id ||
                                  an.assignmentCode) ===
                                (n.assignmentCode?._id || n.assignmentCode),
                            );
                            const adjFactor = adjNorm?.norm ?? 1;
                            return {
                              assignmentCode:
                                n.assignmentCode?._id || n.assignmentCode,
                              code: n.assignmentCode?.code || "",
                              name: n.assignmentCode?.name || "",
                              baseNorm: n.norm || 0,
                              adjustmentNorm: adjFactor,
                              norm: (n.norm || 0) * adjFactor,
                              checked: true,
                            };
                          });
                          formik.setFieldValue(
                            `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                            codes,
                          );
                        } else {
                          formik.setFieldValue(
                            `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                            [],
                          );
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography sx={{ fontSize: "12px", mb: 0.5 }}>
                      Hệ số điều chỉnh
                    </Typography>
                    <FieldAutoCompleted
                      formik={formik}
                      field={`groups.${gIdx}.phases.${pIdx}.adjustmentNormCode`}
                      title=""
                      labelkey="code"
                      data={adjustmentnormsData}
                      onChange={(newValue: any) => {
                        const currentAssignmentCodes =
                          formik.values.groups[gIdx].phases[pIdx]
                            .assignmentCodes || [];

                        const updatedCodes = currentAssignmentCodes.map(
                          (ac: any) => {
                            const adjNorm = newValue?.norms?.find(
                              (n: any) =>
                                (n.assignmentCode?._id || n.assignmentCode) ===
                                ac.assignmentCode,
                            );
                            const newAdjFactor = adjNorm?.norm ?? 1;
                            return {
                              ...ac,
                              adjustmentNorm: newAdjFactor,
                              norm: (ac.baseNorm || 0) * newAdjFactor,
                            };
                          },
                        );

                        formik.setFieldValue(
                          `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                          updatedCodes,
                        );
                      }}
                    />
                  </Box>
                  {formik.values.groups[gIdx].phases[pIdx]
                    .assignmentNormCode && (
                    <Box sx={{ gridColumn: "1 / -1", p: 1 }}>
                      <Typography sx={{ fontSize: "12px", mb: 0.5 }}>
                        Mã giao khoán
                      </Typography>
                      <AppMultiAutocomplete
                        options={
                          // Lấy từ định mức giao khoán, ẩn mã đã chọn
                          (
                            assignmentnormsData.find(
                              (n: any) =>
                                n._id ===
                                formik.values.groups[gIdx].phases[pIdx]
                                  .assignmentNormCode,
                            )?.norms || []
                          )
                            .filter((n: any) => {
                              // Ẩn các mã đã checked = true
                              const currentCodes =
                                formik.values.groups[gIdx].phases[pIdx]
                                  .assignmentCodes || [];
                              const acId =
                                n.assignmentCode?._id || n.assignmentCode;
                              const isSelected = currentCodes.some(
                                (c: any) =>
                                  c.assignmentCode === acId && c.checked,
                              );
                              return !isSelected;
                            })
                            .map((n: any) => ({
                              _id: n.assignmentCode?._id || n.assignmentCode,
                              code: n.assignmentCode?.code || "",
                              name: n.assignmentCode?.name || "",
                              norm: n.norm || 0,
                            }))
                        }
                        value={(
                          formik.values.groups[gIdx].phases[pIdx]
                            .assignmentCodes || []
                        )
                          .filter((ac: any) => ac.checked)
                          .map((ac: any) => ({
                            _id: ac.assignmentCode,
                            code: ac.code,
                            name: ac.name || "",
                            norm: ac.norm,
                          }))}
                        getOptionLabel={(option: any) => option.code || ""}
                        onChange={(newValue: any[]) => {
                          const newCheckedIds = newValue.map((v) => v._id);
                          const currentCodes =
                            formik.values.groups[gIdx].phases[pIdx]
                              .assignmentCodes || [];

                          // Lấy danh sách mã từ định mức
                          const normDoc = assignmentnormsData.find(
                            (n: any) =>
                              n._id ===
                              formik.values.groups[gIdx].phases[pIdx]
                                .assignmentNormCode,
                          );
                          const normCodes = normDoc?.norms || [];

                          // Tạo lại toàn bộ assignmentCodes từ định mức
                          const adjustmentNormCode =
                            formik.values.groups[gIdx].phases[pIdx]
                              .adjustmentNormCode;
                          const adjustmentDoc = adjustmentnormsData.find(
                            (a: any) => a._id === adjustmentNormCode,
                          );

                          const updatedCodes = normCodes.map((n: any) => {
                            const acId =
                              n.assignmentCode?._id || n.assignmentCode;
                            const existingCode = currentCodes.find(
                              (c: any) => c.assignmentCode === acId,
                            );
                            const adjNorm = adjustmentDoc?.norms?.find(
                              (an: any) =>
                                (an.assignmentCode?._id ||
                                  an.assignmentCode) === acId,
                            );
                            const adjFactor = adjNorm?.norm ?? 1;

                            return {
                              assignmentCode: acId,
                              code: n.assignmentCode?.code || "",
                              name: n.assignmentCode?.name || "",
                              baseNorm: n.norm || 0,
                              adjustmentNorm: adjFactor,
                              norm: (n.norm || 0) * adjFactor,
                              checked: newCheckedIds.includes(acId),
                            };
                          });

                          formik.setFieldValue(
                            `groups.${gIdx}.phases.${pIdx}.assignmentCodes`,
                            updatedCodes,
                          );
                        }}
                      />

                      {formik.values.groups[gIdx].phases[
                        pIdx
                      ].assignmentCodes?.filter((ac: any) => ac.checked)
                        .length > 0 && (
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {formik.values.groups[gIdx].phases[
                            pIdx
                          ].assignmentCodes.map((ac: any, cIdx: number) => {
                            if (!ac.checked) return null;
                            return (
                              <Box
                                key={ac.assignmentCode || cIdx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  p: 1,
                                  borderRadius: 1,
                                  border: "1px solid #E0E0E0",
                                }}
                              >
                                <Box sx={{ width: "15%" }}>
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "text.secondary",
                                    }}
                                  >
                                    Mã GK
                                  </Typography>
                                  <FieldInput
                                    field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.code`}
                                    formik={formik}
                                    disabled
                                  />
                                </Box>
                                <Box sx={{ width: "25%" }}>
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "text.secondary",
                                    }}
                                  >
                                    Tên GK
                                  </Typography>
                                  <FieldInput
                                    field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.name`}
                                    formik={formik}
                                    disabled
                                  />
                                </Box>
                                <Box sx={{ width: "15%" }}>
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "text.secondary",
                                    }}
                                  >
                                    ĐM gốc
                                  </Typography>
                                  <TextFieldNumber
                                    field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.baseNorm`}
                                    formik={formik}
                                    disabled
                                  />
                                </Box>
                                <Box sx={{ width: "15%" }}>
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "text.secondary",
                                    }}
                                  >
                                    Hệ số ĐC
                                  </Typography>
                                  <TextFieldNumber
                                    field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.adjustmentNorm`}
                                    formik={formik}
                                    onValueChange={(val) => {
                                      const baseNorm =
                                        formik.values.groups[gIdx].phases[pIdx]
                                          .assignmentCodes[cIdx].baseNorm || 0;
                                      formik.setFieldValue(
                                        `groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.norm`,
                                        baseNorm * val,
                                      );
                                    }}
                                  />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    sx={{
                                      fontSize: "11px",
                                      color: "text.secondary",
                                    }}
                                  >
                                    Định mức
                                  </Typography>
                                  <TextFieldNumber
                                    field={`groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.norm`}
                                    formik={formik}
                                  />
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    formik.setFieldValue(
                                      `groups.${gIdx}.phases.${pIdx}.assignmentCodes.${cIdx}.checked`,
                                      false,
                                    );
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </FieldArray>
  );
}
