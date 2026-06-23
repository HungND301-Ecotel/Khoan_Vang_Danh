import { Box, Button, Grid, IconButton, TextField, Typography } from "@mui/material";
import { FieldArray } from "formik";
import { CloudUpload } from "@mui/icons-material";
import { CircleX } from "lucide-react";
import { AppMultiAutocomplete } from "../../../components/TextField/AppMultiAutocomplete";
import TextFieldNumber from "../../../components/TextField/TextFieldNumber";
import { Materials } from "../../../types";
import { RefObject } from "react";

interface MaterialSectionProps {
  formik: any;
  materialassignmentsData: any[];
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportTemplate: () => void;
}

export default function MaterialSection({
  formik,
  materialassignmentsData,
  fileInputRef,
  handleFileUpload,
  handleExportTemplate,
}: MaterialSectionProps) {
  return (
    <Box>
      {/* Chọn vật tư */}
      <Box
        display="flex"
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 1 }}>
          Vật tư, tài sản
        </Typography>
        <Box display="flex" gap={1}>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
          />
          <Button
            size="small"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<CloudUpload />}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontSize: "12px",
              padding: "4px 8px",
              minWidth: "auto",
              borderColor: "#1976d2",
              color: "#1976d2",
              "&:hover": {
                backgroundColor: "#e3f2fd",
                borderColor: "#1976d2",
              },
            }}
          >
            Tải lên
          </Button>
          <Button
            size="small"
            onClick={handleExportTemplate}
            startIcon={<CloudUpload />}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontSize: "12px",
              padding: "4px 8px",
              minWidth: "auto",
              borderColor: "#1976d2",
              color: "#1976d2",
              "&:hover": {
                backgroundColor: "#e3f2fd",
                borderColor: "#1976d2",
              },
            }}
          >
            Tải xuống
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <AppMultiAutocomplete
          allowDuplicate={false}
          options={materialassignmentsData || []}
          value={formik.values.selectedMaterials || []}
          getOptionLabel={(option: Materials) =>
            option.code +
              " - " +
              `${option.assignmentCode?.code || ""}` || ""
          }
          placeholder="Chọn vật tư..."
          onChange={(newValue) => {
            const updated = newValue.map((item) => {
              const existing = (formik.values.materials || []).find(
                (n: any) => n.material === item._id
              );
              return {
                material: item._id,
                quantity: existing?.quantity ?? undefined,
              };
            });

            formik.setFieldValue("materials", updated);
            formik.setFieldValue("selectedMaterials", newValue);
          }}
          width="100%"
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
              p: 2,
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
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        mb: 1,
                      }}
                    >
                      Mã vật tư
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={
                        materialassignmentsData.find(
                          (ac: Materials) =>
                            ac._id ===
                            formik.values.materials[index]?.material,
                        )?.code +
                          " - " +
                          `${
                            materialassignmentsData.find(
                              (ac: Materials) =>
                                ac._id ===
                                formik.values.materials[index]
                                  ?.material,
                            )?.assignmentCode?.code || ""
                          }` || ""
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
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        mb: 1,
                      }}
                    >
                      Tên vật tư, tài sản
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={
                        materialassignmentsData.find(
                          (ac: Materials) =>
                            ac._id ===
                            formik.values.materials[index]?.material,
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
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        mb: 1,
                      }}
                    >
                      Số lượng
                    </Typography>
                    <TextFieldNumber
                      formik={formik}
                      field={`materials.${index}.quantity`}
                    />
                  </Grid>
                  {/* Đơn vị tính */}
                  <Grid item xs={12} sm={2}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        mb: 1,
                      }}
                    >
                      Đơn vị tính
                    </Typography>
                    <TextField
                      fullWidth
                      disabled
                      size="small"
                      value={
                        materialassignmentsData.find(
                          (ac: Materials) =>
                            ac._id ===
                            formik.values.materials[index]?.material,
                        )?.uom?.name || ""
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
                    const updatedSelectedMaterials =
                      formik.values.selectedMaterials.filter(
                        (s: any, i: number) => i !== index,
                      );
                    formik.setFieldValue(
                      `selectedMaterials`,
                      updatedSelectedMaterials,
                    );

                    const updatedMaterials = formik.values.materials.filter(
                      (s: any, i: number) => i !== index,
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
    </Box>
  );
}
