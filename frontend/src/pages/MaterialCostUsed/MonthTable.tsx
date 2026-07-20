import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import GroupTable from "./GroupTable";
import { formattedPrice } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function MonthTable({
  handleOpen,
  department,
}: {
  handleOpen: (record: any) => void;
  department?: any;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const departmentId = department?._id || department;

  const { data: months = [], isLoading } = useQuery({
    queryKey: ["materialcostused-months", departmentId],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/months`, {
        params: { department: departmentId },
      });
      return res.data.data;
    },
    enabled: !!departmentId,
  });

  const handleView = (record: any) => {
    const id = record?._id;
    if (!id) return;
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: any) => (
    <Box sx={{ padding: "10px" }}>
      <GroupTable
        handleOpen={handleOpen}
        department={department}
        month={record.month}
      />
    </Box>
  );

  const innerColumns = [
    {
      title: "",
      dataIndex: "month",
      key: "month",
      render: (text: string) => (
        <Typography fontWeight="bold">
          {text ? dayjs(text).format("MM/YYYY") : ""}
        </Typography>
      ),
    },
    {
      title: "",
      width: 150,
      dataIndex: "totalMonthCost",
      key: "totalMonthCost",
      render: (text: string, item: any) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {formattedPrice(item.totalMonthCost)}
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
        dataSource={months || []}
        pagination={false}
        size="small"
        rowKey={(item) => item._id}
        showHeader={false}
        loading={isLoading}
        expandable={{
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record._id || null : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({ className: "month-custom-row" })}
        rowClassName={(record, index) =>
          index === 0 ? "month-custom-row first-data-row" : "month-custom-row"
        }
      />
      <style>{`
        .month-custom-row > td { background-color: #e0e0e0 !important; }
      `}</style>
    </Paper>
  );
}
