import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import React, { useState } from "react";
import PhaseTable from "./PhaseTable";
import { formattedPrice } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function ShiftTable({
  handleOpen,
  department,
  month,
  date,
  productionScope,
}: {
  handleOpen: (record: any) => void;
  department?: any;
  month: string;
  date: number;
  productionScope?: string;
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const departmentId = department?._id || department;

  // Lấy danh sách ca từ API dates (đã có sẵn shifts)
  const { data: dates = [] } = useQuery({
    queryKey: ["materialcostused-dates", departmentId, month, productionScope],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/dates`, {
        params: { department: departmentId, month, productionScope },
      });
      return res.data.data;
    },
    enabled: !!departmentId && !!month,
  });

  // Lấy shifts từ date cụ thể
  const dateData = dates.find((d: any) => d.date === date);
  const shifts = dateData?.shifts || [];

  // Tính tổng chi phí theo ca
  const { data: phases = [] } = useQuery({
    queryKey: ["materialcostused-phases-by-date", departmentId, month, date],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/phases-by-date`, {
        params: { department: departmentId, month, date },
      });
      return res.data.data;
    },
    enabled: !!departmentId && !!month && date != null,
  });

  // Group by shift và tính tổng
  const shiftData = shifts.map((shift: number) => {
    const phasesInShift = phases.filter((p: any) => p.shift === shift);
    const totalCost = phasesInShift.reduce(
      (sum: number, p: any) => sum + (p.totalUsedCost || 0),
      0,
    );
    return {
      shift,
      totalCost,
    };
  });

  const handleView = (record: any) => {
    const shift = record?.shift;
    if (shift == null) return;
    setExpandedRow((prev) => (prev === shift ? null : shift));
  };

  const expandedRowRender = (record: any) => (
    <Box sx={{ padding: "10px" }}>
      <PhaseTable
        handleOpen={handleOpen}
        department={department}
        month={month}
        date={date}
        shift={record.shift}
        productionScope={productionScope}
      />
    </Box>
  );

  const innerColumns = [
    {
      title: "",
      dataIndex: "shift",
      key: "shift",
      render: (text: number) => (
        <Typography fontWeight="bold">Ca {text}</Typography>
      ),
    },
    {
      title: "",
      width: 150,
      dataIndex: "totalCost",
      key: "totalCost",
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
          {expandedRow === record?.shift ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      ),
    },
  ];

  return (
    <Paper>
      <Table
        columns={innerColumns}
        dataSource={shiftData || []}
        pagination={false}
        size="small"
        rowKey={(item) => item.shift}
        showHeader={false}
        expandable={{
          expandedRowKeys: expandedRow != null ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record.shift : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({ className: "shift-custom-row" })}
        rowClassName={(record, index) =>
          index === 0 ? "shift-custom-row first-data-row" : "shift-custom-row"
        }
      />
      <style>{`
        .shift-custom-row > td { background-color: #e1dede !important; }
      `}</style>
    </Paper>
  );
}
