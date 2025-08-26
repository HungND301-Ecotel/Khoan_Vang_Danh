import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import api from "../../config/api.config";
import {
  AssignmentCodeInputType,
  MaterialAssignmentInputType,
  MaterialAssignmentOutputType,
  Materials,
} from "../../types";
import { showErrorAlert, showSuccessAlert } from "../../components/Alert";

export default function Materialunitprice() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<MaterialAssignmentOutputType[]>([]);

  const { data: materialAssignments = [] } = useQuery({
    queryKey: ["materialAssignments"],
    queryFn: () =>
      api.get("/materialassignments").then((res) => setData(res.data.data)),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (
      updateMaterialAssignment: Partial<MaterialAssignmentInputType>
    ) =>
      api
        .put(
          `/materialassignments/${updateMaterialAssignment._id}`,
          updateMaterialAssignment
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });
  const updatematerialMutation = useMutation({
    mutationFn: (updateAssignmentCode: Partial<AssignmentCodeInputType>) =>
      api
        .put(
          `/assignmentcodes/${updateAssignmentCode._id}`,
          updateAssignmentCode
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialAssignments"] });
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  return (
    <Box>
      {/* <Box display={'flex'} justifyContent={'flex-end'} gap={2} mb={3}>
        <Button variant='contained' onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
        <Button variant='contained' onClick={() => setIsEditing(false)}>Lưu lại</Button>
        <Button variant='contained' onClick={() => setIsEditing(false)}>Hủy bỏ</Button>
      </Box> */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Mã vật tư
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Mã giao khoán
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Tên vật tư, tài sản
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                ĐVT
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                  width: 150,
                }}
              >
                Số lượng
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                  width: 200,
                }}
              >
                Đơn giá bình quân năm
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  border: "1px solid grey",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Ghi chú
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((materialAssignment: MaterialAssignmentOutputType) => (
              <>
                <TableRow>
                  <TableCell
                    sx={{ border: "1px solid grey", color: "blue" }}
                  ></TableCell>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid grey", color: "blue" }}
                  >
                    {materialAssignment.code}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid grey", color: "blue" }}>
                    {materialAssignment.name}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid grey", color: "blue" }}
                  >
                    {materialAssignment.uom}
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid grey", color: "blue" }}
                  ></TableCell>
                  <TableCell
                    align="center"
                    sx={{ border: "1px solid grey", color: "blue" }}
                  >
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={
                          materialAssignment.price
                            ? materialAssignment.price.toLocaleString()
                            : ""
                        }
                      />
                    ) : materialAssignment.price ? (
                      materialAssignment.price.toLocaleString()
                    ) : (
                      ""
                    )}
                  </TableCell>
                  <TableCell
                    sx={{ border: "1px solid grey", color: "blue" }}
                  ></TableCell>
                </TableRow>
                {materialAssignment.materials.map((material: Materials) => (
                  <TableRow>
                    <TableCell align="center" sx={{ border: "1px solid grey" }}>
                      {material.code}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid grey" }}></TableCell>
                    <TableCell sx={{ border: "1px solid grey" }}>
                      {material.name}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid grey" }}>
                      {material.uom?.name}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid grey" }}>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={
                            material.quantity
                              ? material.quantity.toLocaleString()
                              : ""
                          }
                        />
                      ) : material.quantity ? (
                        material.quantity.toLocaleString()
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ border: "1px solid grey" }}>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={
                            material.currentPrice
                              ? material.currentPrice.toLocaleString()
                              : ""
                          }
                        />
                      ) : material.currentPrice ? (
                        material.currentPrice.toLocaleString()
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid grey" }}></TableCell>
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
