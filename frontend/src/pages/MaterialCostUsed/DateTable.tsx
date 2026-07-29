import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import React, { useState } from "react";
import ShiftTable from "./ShiftTable";
import { formattedPrice } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function DateTable({
  handleOpen,
  department,
  month,
  productionScope,
}: {
  handleOpen: (record: any) => void;
  department?: any;
  month: string;
  productionScope?: string;
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const departmentId = department?._id || department;

  const { data: dates = [], isLoading } = useQuery({
    queryKey: ["materialcostused-dates", departmentId, month, productionScope],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/dates`, {
        params: { department: departmentId, month, productionScope },
      });
      return res.data.data;
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
      <ShiftTable
        handleOpen={handleOpen}
        department={department}
        month={month}
        date={record.date}
        productionScope={productionScope}
      />
    </Box>
  );

  const innerColumns = [
    {
      title: "",
      dataIndex: "date",
      key: "date",
      render: (text: number) => (
        <Typography fontWeight="bold">Ngày {text}</Typography>
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
        dataSource={dates || []}
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
        onRow={() => ({ className: "date-custom-row" })}
        rowClassName={(record, index) =>
          index === 0 ? "date-custom-row first-data-row" : "date-custom-row"
        }
      />
      <style>{`
        .date-custom-row > td { background-color: #e8e8e8 !important; }
      `}</style>
    </Paper>
  );
}
