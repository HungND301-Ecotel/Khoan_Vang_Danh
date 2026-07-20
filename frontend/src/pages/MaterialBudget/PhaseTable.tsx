import { Box, IconButton, Typography, Paper } from "@mui/material";
import React, { useState } from "react";
import { Table } from "antd";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AssignmentNormTable from "./AssignmentNormTable";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function PhaseTable({
  department,
  month,
  productionScope,
}: {
  department: string;
  month?: string;
  productionScope: any;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const productionScopeId = productionScope?._id || productionScope;

  const { data: phases = [] } = useQuery({
    queryKey: ["materialbudget-phases", department, month, productionScopeId],
    queryFn: async () => {
      const res = await api.get(`/materialbudgets/phases`, {
        params: {
          department,
          month,
          productionScope: productionScopeId,
        },
      });
      return res.data.data;
    },
    enabled: !!department && !!month && !!productionScopeId,
  });

  const handleView = (record: any) => {
    const id = record?.key;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: any) => (
    <Box sx={{ p: 2 }}>
      <AssignmentNormTable data={record} />
    </Box>
  );

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
        <Typography>{formatDecimal(value)}</Typography>
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
      dataIndex: "totalBudgetCost",
      key: "totalBudgetCost",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{formattedPrice(value)}</Typography>
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
        dataSource={phases || []}
        pagination={false}
        size="small"
        rowKey={(item) => item.key}
        expandable={{
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record.key || null : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onHeaderRow={() => ({
          className: "custom-header1",
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
