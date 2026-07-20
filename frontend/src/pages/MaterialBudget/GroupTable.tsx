import { Delete, Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import PhaseTable from "./PhaseTable";
import { showConfirmAlert } from "../../components/Alert";
import { formattedPrice } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function GroupTable({
  department,
  month,
}: {
  department?: any;
  month?: string;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const departmentId = department?._id || department;
  const { data: scopes = [] } = useQuery({
    queryKey: ["materialbudget-scopes", departmentId, month],
    queryFn: async () => {
      const res = await api.get(`/materialbudgets/scopes`, {
        params: { department: departmentId, month },
      });
      return res.data.data;
    },
    enabled: !!departmentId && !!month,
  });

  const handleView = (record: any) => {
    const id = record?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: any) => {
    return (
      <Box sx={{ padding: "10px" }}>
        <PhaseTable
          department={departmentId}
          month={month}
          productionScope={record?.productionScope}
        />
      </Box>
    );
  };
  const innerColumns = [
    {
      title: "",
      dataIndex: "productionScope",
      key: "productionScope",
      render: (text: any, item: any, index: number) => (
        <Typography fontWeight="bold">{item.productionScope?.code}</Typography>
      ),
    },
    {
      title: "",
      width: 150,
      dataIndex: "totalBudgetCost",
      key: "totalBudgetCost",
      render: (text: string, item: any) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {formattedPrice(item.totalBudgetCost)}
        </Typography>
      ),
    },
    {
      title: "",
      dataIndex: "view",
      key: "view",
      width: 50,
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
          {expandedRow === record?._id ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      ),
    },
  ];
  return (
    <Paper>
      <Table
        columns={innerColumns}
        dataSource={scopes || []}
        pagination={false}
        size="small"
        rowKey={(item) => item._id}
        showHeader={false}
        expandable={{
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record.key || null : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({
          className: "custom-row",
        })}
        rowClassName={(record, index) =>
          // Thêm class 'first-data-row' cho hàng đầu tiên
          index === 0 ? "custom-row first-data-row" : "custom-row"
        }
      />
      <style>{`
                .custom-row > td {
                background-color: #dcd7d7fa !important;
                }
            `}</style>
    </Paper>
  );
}
