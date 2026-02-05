import {
  Box,
  IconButton,
  Typography,
  Table as TableMui,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TableBody,
} from "@mui/material";
import React, { Fragment, useState } from "react";
import { Table, TableProps } from "antd";
import dayjs from "dayjs";
import { formatDecimal, formattedPrice } from "../../utils/helpers";

export default function PhaseTable({
  data,
  materials,
}: {
  data: any[];
  materials: any[];
}) {
  const innerColumns = [
    {
      title: "",
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
      title: <Typography>Tên công đoạn</Typography>,
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
    },
    {
      title: <Typography>Sản lượng</Typography>,
      dataIndex: "production",
      key: "production",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
  ];
  return (
    <Paper sx={{ paddingBottom: "10px" }}>
      <Table
        columns={innerColumns}
        dataSource={data || []}
        pagination={false}
        size="small"
        rowKey={(item) => item.key}
        onHeaderRow={() => ({
          className: "custom-header1",
        })}
      />
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
            {materials.map((m: any) => (
              <Fragment>
                <TableRow>
                  <TableCell>{m?.assignmentCode?.code}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>{m?.assignmentCode?.name}</TableCell>
                  <TableCell>{m?.assignmentCode?.uom?.name}</TableCell>
                  <TableCell>
                    {formattedPrice(
                      m.materials.reduce(
                        (sum: number, i: any) => sum + (i?.quantity || 0),
                        0,
                      ),
                    )}
                  </TableCell>
                  <TableCell>{formattedPrice(m.price)}</TableCell>
                  <TableCell>
                    {formattedPrice(
                      m.materials.reduce(
                        (sum: number, i: any) => sum + (i?.cost || 0),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
                {m.materials.map((i: any) => (
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>{i?.material?.code}</TableCell>
                    <TableCell>{i?.material?.name}</TableCell>
                    <TableCell>{i?.material?.uom?.name}</TableCell>
                    <TableCell>{formatDecimal(i.quantity)}</TableCell>
                    <TableCell>
                      {m?.assignmentCode ? "" : formattedPrice(i.price)}
                    </TableCell>
                    <TableCell>{formattedPrice(i.cost)}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </TableMui>
      </Paper>
      <style>{`
        .custom-header1 > th {
          background-color: #cfcacafa !important;
        }
            `}</style>
    </Paper>
  );
}
