import {
  Box,
  Paper,
  Table as TableMui,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import React, { Fragment } from "react";
import { formattedPrice, formatDecimal } from "../../utils/helpers";

// Nhóm materials theo assignmentCode
const groupMaterialsByAssignmentCode = (materials: any[]) => {
  const groupMap: Record<string, any> = {};

  materials.forEach((mat: any) => {
    const material = mat.material;
    const assignmentCode =
      mat.assignmentCode || material?.assignmentCode || null;
    const assignmentCodeValue = assignmentCode?.code || "";
    const price = assignmentCode ? mat.price : "";
    const compoundKey = assignmentCode
      ? `${assignmentCodeValue}_${price}`
      : `NO_ASSIGNMENTCODE`;

    if (!groupMap[compoundKey]) {
      groupMap[compoundKey] = {
        assignmentCode,
        price,
        materials: [],
      };
    }
    groupMap[compoundKey].materials.push({ ...mat, material, assignmentCode });
  });

  const result = Object.values(groupMap);

  // Sort: có assignmentCode lên trước, không có xuống sau
  result.sort((a, b) => {
    const codeA = a.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    const codeB = b.assignmentCode?.code || "NO_ASSIGNMENTCODE";
    if (codeA === "NO_ASSIGNMENTCODE" && codeB !== "NO_ASSIGNMENTCODE")
      return 1;
    if (codeA !== "NO_ASSIGNMENTCODE" && codeB === "NO_ASSIGNMENTCODE")
      return -1;
    if (codeA < codeB) return -1;
    if (codeA > codeB) return 1;
    return 0;
  });

  return result;
};

export default function OtherTaskMaterialsTable({
  handleOpen,
  records,
}: {
  handleOpen: (record: any) => void;
  records: any[];
}) {
  // Gộp materials từ tất cả records
  const allMaterials: any[] = [];
  records.forEach((record) => {
    (record.materials || []).forEach((mat: any) => {
      allMaterials.push(mat);
    });
  });

  // Nhóm theo assignmentCode
  const groupedMaterials = groupMaterialsByAssignmentCode(allMaterials);

  return (
    <Paper sx={{ margin: "20px" }}>
      <TableMui>
        <TableHead sx={{ backgroundColor: "#dcd7d7fa" }}>
          <TableRow>
            <TableCell>Mã giao khoán</TableCell>
            <TableCell>Mã vật tư</TableCell>
            <TableCell>Tên vật tư, tài sản</TableCell>
            <TableCell>ĐVT</TableCell>
            <TableCell>Số lượng</TableCell>
            <TableCell>Đơn giá bình quân</TableCell>
            <TableCell>Chi phí thực hiện</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ backgroundColor: "white" }}>
          {groupedMaterials.map((group: any, idx: number) => (
            <Fragment key={idx}>
              {/* Hàng nhóm - hiển thị mã GK + tổng SL + đơn giá TB */}
              <TableRow>
                <TableCell>{group?.assignmentCode?.code}</TableCell>
                <TableCell></TableCell>
                <TableCell>
                  {group?.assignmentCode?.name || "Vật tư không có định mức"}
                </TableCell>
                <TableCell>{group?.assignmentCode?.uom?.name}</TableCell>
                <TableCell>
                  {formatDecimal(
                    group.materials.reduce(
                      (sum: number, i: any) => sum + (i?.quantity || 0),
                      0,
                    ),
                  )}
                </TableCell>
                <TableCell>{formattedPrice(group.price)}</TableCell>
                <TableCell>
                  {formattedPrice(
                    group.materials.reduce(
                      (sum: number, i: any) => sum + (i?.cost || 0),
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
              {/* Hàng con - chi tiết từng vật tư */}
              {group.materials.map((i: any, iIdx: number) => (
                <TableRow key={iIdx}>
                  <TableCell></TableCell>
                  <TableCell>{i?.material?.code}</TableCell>
                  <TableCell>{i?.material?.name}</TableCell>
                  <TableCell>{i?.material?.uom?.name}</TableCell>
                  <TableCell>{formatDecimal(i.quantity)}</TableCell>
                  <TableCell>
                    {group?.assignmentCode ? "" : formattedPrice(i.price)}
                  </TableCell>
                  <TableCell>{formattedPrice(i.cost)}</TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </TableMui>
    </Paper>
  );
}
