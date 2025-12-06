import {
  Table as TableMui,
  Box, IconButton, Typography,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import React, { Fragment, useState } from "react";
import { InitialPlannedCostOutputType, MaterialCostUsedOutputType } from "../../types";
import { Table, TableProps } from "antd";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { showErrorAlert } from "../../components/Alert";
import dayjs from "dayjs";

export default function PhaseTable({
  data,
}: {
  data: MaterialCostUsedOutputType;
}) {
  const innerColumns = [
    {
      title: <Typography></Typography>,
      width: 120,
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      render: (text: string, item: any, index: number) => (
        <Typography>Công đoạn {index + 1}</Typography>
      ),
    },
    {
      title: <Typography>Mã công đoạn</Typography>,
      width: 150,
      dataIndex: "code",
      key: "code",
      render: (text: string, item: any) => (
        <Typography>{item.phase?.code}</Typography>
      ),
    },
    {
      title: (
        <Typography>
          Tên công đoạn
        </Typography>
      ),
      dataIndex: "name",
      key: "name",
      render: (text: string, item: any) => (
        <Typography>{item.phase?.name}</Typography>
      ),
    },
    {
      title: <Typography>ĐVT</Typography>,
      dataIndex: "unit",
      key: "unit",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{value ? value.toLocaleString() : ""}</Typography>
      ),
    },
    {
      title: <Typography>Sản lượng</Typography>,
      dataIndex: "production",
      key: "production",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{value ? value.toLocaleString() : ""}</Typography>
      ),
    },
    {
      title: <Typography>Mã định mức giao khoán</Typography>,
      dataIndex: "assignmentNormCode",
      key: "assignmentNormCode",
      align: "center" as const,
      render: (value: number, item: any) => (
        <Typography>{item?.assignmentNormCode?.code}</Typography>
      ),
    },
    {
      title: <Typography>Mã hệ số điều chỉnh định mức</Typography>,
      dataIndex: "adjustmentNormCode",
      key: "adjustmentNormCode",
      align: "center" as const,
      render: (value: number, item: any) => (
        <Typography>{item?.adjustmentNormCode?.code}</Typography>
      ),
    },
    {
      title: <Typography>Chi phí</Typography>,
      dataIndex: "totalUsedCost",
      key: "totalUsedCost",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{value ? value.toLocaleString() : ""}</Typography>
      ),
    },
  ];
  return (
    <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
      {data.group.map((g: any) => (
        <Box>
          <Box sx={{ backgroundColor: "#ccc6c6ff", p: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight="bold">{dayjs(g?.startDate).format("DD/MM/YYYY")} - {dayjs(g?.endDate).format("DD/MM/YYYY")}</Typography>
            <Typography>{g.totalUsedCost ? g.totalUsedCost.toLocaleString() : ""}</Typography>
          </Box>
          <Table
            columns={innerColumns}
            dataSource={g.phases || []}
            pagination={false}
            size="small"
            rowKey={(item) => item.key}
          />
          <Box>
            <TableMui>
              <TableHead>
                <TableRow>
                  <TableCell >Mã giao khoán</TableCell>
                  <TableCell >Mã vật tư</TableCell>
                  <TableCell >Tên vật tư, tài sản</TableCell>
                  <TableCell >ĐVT</TableCell>
                  <TableCell >Số lượng</TableCell>
                  <TableCell >Đơn giá bình quân</TableCell>
                  <TableCell >Chi phí thực hiện</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ backgroundColor: "white" }}>
                {g.materials.map((m: any) => (
                  <Fragment>
                    <TableRow>
                      <TableCell>{m?.assignmentCode?.code}</TableCell>
                      <TableCell></TableCell>
                      <TableCell>{m?.assignmentCode?.name}</TableCell>
                      <TableCell>{m?.assignmentCode?.uom?.name}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {m.materials.map((i: any) => (
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell>{i?.material?.code}</TableCell>
                        <TableCell>{i?.material?.name}</TableCell>
                        <TableCell>{i?.material?.uom?.name}</TableCell>
                        <TableCell>{i?.quantity}</TableCell>
                        <TableCell>{(i?.price || 0).toLocaleString()}</TableCell>
                        <TableCell>{(i?.cost || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </TableMui>
          </Box>
        </Box>
      ))}
    </Box >
  );
}
