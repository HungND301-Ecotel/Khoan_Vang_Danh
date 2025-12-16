import { Box, IconButton, Typography, Table as TableMui, TableHead, TableRow, TableCell, Paper, } from "@mui/material";
import React, { useState } from "react";
import { MaterialBudgetCostType } from "../../types";
import { Table, TableProps } from "antd";
import { Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import { showErrorAlert } from "../../components/Alert";
import AssignmentNormTable from "./AssignmentNormTable";
import dayjs from "dayjs";

export default function PhaseTable({
  data,
}: {
  data: any[];
}) {
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleView = (record: any) => {
    const id = record?.key;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: any) => {
    const key = record.phase?._id || "";
    const data = expandedData[key] || record;
    if (data === null) {
      return (
        <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography color="error">
            Không thể tải thông tin chi tiết. Có thể bản ghi đã bị xóa.
          </Typography>
        </Box>
      );
    }
    if (!data) {
      return <Box sx={{ p: 2 }}>Đang tải...</Box>;
    }
    return <Box sx={{ p: 2 }}><AssignmentNormTable data={data} /></Box>;
  };

  const innerColumns = [
    {
      title: '',
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
        <Typography >
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
      title: <Typography >ĐVT</Typography>,
      dataIndex: "unit",
      key: "unit",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{value ? value.toLocaleString() : ""}</Typography>
      ),
    },
    {
      title: <Typography >Sản lượng</Typography>,
      dataIndex: "production",
      key: "production",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{value ? (Number(value.toFixed(3))).toLocaleString() : ""}</Typography>
      ),
    },
    {
      title: <Typography >Mã định mức giao khoán</Typography>,
      dataIndex: "assignmentNormCode",
      key: "assignmentNormCode",
      align: "center" as const,
      render: (value: number, item: any) => (
        <Typography>{item?.assignmentNormCode?.code}</Typography>
      ),
    },
    {
      title: <Typography >Mã hệ số điều chỉnh định mức</Typography>,
      dataIndex: "adjustmentNormCode",
      key: "adjustmentNormCode",
      align: "center" as const,
      render: (value: number, item: any) => (
        <Typography>{item?.adjustmentNormCode?.code}</Typography>
      ),
    },
    {
      title: <Typography >Chi phí</Typography>,
      dataIndex: "totalBudgetCost",
      key: "totalBudgetCost",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{value ? (Number(value.toFixed(0))).toLocaleString() : ""}</Typography>
      ),
    },
    {
      title: <Typography>Xem</Typography>,
      dataIndex: "view",
      key: "view",
      width: 80,
      align: "center" as const,
      render: (_: any, record: any) => (
        <IconButton
          onClick={() => handleView(record)}
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          {expandedRow === record?.key ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      ),
    },
  ];
  return (
    <Paper>
      <Table
        columns={innerColumns}
        dataSource={data || []}
        pagination={false}
        size="small"
        rowKey={(item) => item.key}
        expandable={{
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record.key || null : null);
          },
          expandedRowRender,
          showExpandColumn: false
        }}
        onHeaderRow={() => ({
          className: "custom-header1"
        })}
      />
      <style>{`
        .custom-header1 > th {
          background-color: #cfcacafa !important;
        }
            `}</style>
    </Paper>
  );
}
