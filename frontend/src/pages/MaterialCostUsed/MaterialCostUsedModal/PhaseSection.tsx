import { Box, Paper, TextField, Typography, Autocomplete } from "@mui/material";
import { FieldArray } from "formik";
import { PhaseOutputType, PhaseType } from "../../../types";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import FieldMonthYear from "../../../ui/FieldMonth_Year";
import { FormikErrors, FormikTouched } from "formik";
import FieldAutoCompleted from "../../../components/TextField/FieldAutoCompleted";
import FieldInput from "../../../components/TextField/FieldInput";

interface PhaseSectionProps {
  formik: any;
  phasesData: PhaseOutputType[];
  isOtherTask: boolean;
  cuttingPhaseGroupKey: string;
}

export default function PhaseSection({
  formik,
  phasesData,
  isOtherTask,
  cuttingPhaseGroupKey,
}: PhaseSectionProps) {
  const getError = (index: number, field: keyof PhaseType): string => {
    const phasesErrors = formik.errors.phases as FormikErrors<PhaseType>[] | undefined;
    const error = phasesErrors?.[index];

    const phasesTouched = formik.touched.phases as FormikTouched<PhaseType>[] | undefined;
    const touched = phasesTouched?.[index];

    if (touched?.[field] && error?.[field]) {
      return error[field] as string;
    }
    return "";
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #d0d7de",
          background: "transparent",
          borderRadius: "8px",
          p: 2,
          mt: 2,
          position: "relative",
        }}
      >
        {!isOtherTask && (
          <FieldMonthYear formik={formik} fieldName="month" disabled={true} />
        )}

        <FieldArray name="phases">
          {() => (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                p: 2,
              }}
            >
              {formik.values.phases.map((item: any, index: number) => {
                const phase = phasesData.find(
                  (pg: PhaseOutputType) => pg._id === item.phase,
                );

                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      border: "1px solid #d0d7de",
                      background: "transparent",
                      borderRadius: "8px",
                      p: 2,
                      mt: 2,
                      position: "relative",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "15px",
                        color: "#444",
                        position: "absolute",
                        top: -10,
                        paddingInline: 2,
                        zIndex: 999,
                        background: "#f5f5f5",
                      }}
                    >
                      Công đoạn {index + 1}
                    </Typography>
                    <Box
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
                      <Box
                        sx={{
                          gridColumn: isOtherTask ? "span 2" : "span 1",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
                        >
                          {isOtherTask ? "Chọn công đoạn" : "Mã công đoạn"}
                        </Typography>
                        {isOtherTask ? (
                          <FieldAutoCompleted
                            formik={formik}
                            field={`phases[${index}].phase`}
                            title=""
                            labelkey="code"
                            data={phasesData}
                            onChange={(newValue) => {
                              formik.setFieldValue(
                                `phases[${index}].phase`,
                                newValue?._id || "",
                              );
                              formik.setFieldValue(
                                `phases[${index}].unit`,
                                (newValue as any)?.unit || "mét",
                              );
                            }}
                          />
                        ) : (
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
                        )}
                      </Box>

                      {/* Tên công đoạn */}
                      {!isOtherTask && (
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
                      )}

                      {/* Sản lượng */}
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
                        <TextFieldNumber
                          formik={formik}
                          field={`phases.${index}.production`}
                        />
                      </Box>

                      {/* Đơn vị tính */}
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: "14px",
                            mb: 0.5,
                          }}
                        >
                          Đơn vị tính
                        </Typography>
                        <FieldInput
                          formik={formik}
                          field={`phases.${index}.unit`}
                          title=""
                        />
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </FieldArray>
      </Paper>
    </Box>
  );
}
