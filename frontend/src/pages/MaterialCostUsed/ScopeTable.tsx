import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import React, { useState } from "react";
import DateTable from "./DateTable";
import OtherTaskDateTable from "./OtherTaskDateTable";
import { formattedPrice } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function ScopeTable({
  handleOpen,
  department,
  month,
}: {
  handleOpen: (record: any) => void;
  department?: any;
  month: string;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const departmentId = department?._id || department;

  const { data: scopes = [], isLoading } = useQuery({
    queryKey: ["materialcostused-scopes", departmentId, month],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/scopes`, {
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

  const expandedRowRender = (record: any) => (
    <Box sx={{ padding: "10px" }}>
      {record.isOtherTask ? (
        // Công việc khác - hiển thị ngày
        <OtherTaskDateTable
          handleOpen={handleOpen}
          department={department}
          month={month}
        />
      ) : (
        // Diện sản xuất bình thường - hiển thị ngày
        <DateTable
          handleOpen={handleOpen}
          department={department}
          month={month}
          productionScope={record.productionScope?._id || record._id}
        />
      )}
    </Box>
  );

  const innerColumns = [
    {
      title: "",
      dataIndex: "productionScope",
      key: "productionScope",
      render: (text: any) => (
        <Typography fontWeight="bold">
          {text?.code || text?.name || "Công việc khác"}
        </Typography>
      ),
    },
    {
      title: "",
      width: 150,
      dataIndex: "totalUsedCost",
      key: "totalUsedCost",
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
        loading={isLoading}
        expandable={{
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record._id || null : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({ className: "scope-custom-row" })}
        rowClassName={(record, index) =>
          index === 0 ? "scope-custom-row first-data-row" : "scope-custom-row"
        }
      />
      <style>{`
        .scope-custom-row > td { background-color: #e8e8e8 !important; }
      `}</style>
    </Paper>
  );
}
