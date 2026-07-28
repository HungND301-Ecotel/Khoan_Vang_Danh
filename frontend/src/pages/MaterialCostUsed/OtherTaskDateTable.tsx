import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import React, { useState } from "react";
import OtherTaskShiftTable from "./OtherTaskShiftTable";
import { formattedPrice } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function OtherTaskDateTable({
  handleOpen,
  department,
  month,
}: {
  handleOpen: (record: any) => void;
  department?: any;
  month: string;
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const departmentId = department?._id || department;

  // Lấy danh sách ngày từ OtherMaterialCost
  const { data: otherTasks = [], isLoading } = useQuery({
    queryKey: ["othermaterialcosts-dates", departmentId, month],
    queryFn: async () => {
      const res = await api.get(`/othermaterialcosts`, {
        params: { department: departmentId, month },
      });
      const data = res.data.data || [];
      // Group by date và tổng hợp shifts
      const dateMap = new Map();
      data.forEach((item: any) => {
        const date = item.date;
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            totalDateCost: 0,
            shifts: [],
          });
        }
        const dateEntry = dateMap.get(date);
        dateEntry.totalDateCost += item.totalUsedCost || 0;
        if (item.shift && !dateEntry.shifts.includes(item.shift)) {
          dateEntry.shifts.push(item.shift);
        }
      });
      return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
    },
    enabled: !!departmentId && !!month,
  });

  const handleView = (record: any) => {
    const date = record?.date;
    if (date == null) return;
    setExpandedRow((prev) => (prev === date ? null : date));
  };

  const expandedRowRender = (record: any) => (
    <Box sx={{ padding: "10px" }}>
      <OtherTaskShiftTable
        handleOpen={handleOpen}
        department={department}
        month={month}
        date={record.date}
      />
    </Box>
  );

  const innerColumns = [
    {
      title: "",
      dataIndex: "date",
      key: "date",
      render: (text: number) => (
        <Typography fontWeight="bold">
          Ngày {text}
        </Typography>
      ),
    },
    {
      title: "",
      width: 150,
      dataIndex: "totalDateCost",
      key: "totalDateCost",
      render: (text: number) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {formattedPrice(text)}
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
          {expandedRow === record?.date ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      ),
    },
  ];

  return (
    <Paper>
      <Table
        columns={innerColumns}
        dataSource={otherTasks || []}
        pagination={false}
        size="small"
        rowKey={(item) => item.date}
        showHeader={false}
        loading={isLoading}
        expandable={{
          expandedRowKeys: expandedRow != null ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record.date : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({ className: "otherdate-custom-row" })}
        rowClassName={(record, index) =>
          index === 0 ? "otherdate-custom-row first-data-row" : "otherdate-custom-row"
        }
      />
      <style>{`
        .otherdate-custom-row > td { background-color: #e8e8e8 !important; }
      `}</style>
    </Paper>
  );
}
