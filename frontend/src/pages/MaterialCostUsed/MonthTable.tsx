import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import GroupTable from "./GroupTable";
import { formattedPrice } from "../../utils/helpers";

export default function MonthTable({
  data,
  handleOpen,
  department,
  handleDeleteMutation,
}: {
  data: any[];
  handleOpen: (record: any) => void;
  department?: any;
  handleDeleteMutation: (params: { ids: React.Key[], isOtherTask?: boolean }) => void;
}) {
  const [expandedData, setExpandedData] = useState<{ [key: string]: any }>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleView = (record: any) => {
    const id = record?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: any) => {
    const key = record._id || "";
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
    if (!data.scopes) {
      return <Box sx={{ p: 2 }}>Đang tải...</Box>;
    }
    return (
      <Box sx={{ padding: "10px" }}>
        <GroupTable
          data={data.scopes}
          handleOpen={handleOpen}
          department={department}
          month={data.month}
          handleDeleteMutation={handleDeleteMutation}
        />
      </Box>
    );
  };

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
        dataSource={data || []}
        pagination={false}
        size="small"
        rowKey={(item) => item._id}
        showHeader={false}
        expandable={{
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record._id || null : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({
          className: "month-custom-row",
        })}
        rowClassName={(record, index) =>
          index === 0 ? "month-custom-row first-data-row" : "month-custom-row"
        }
      />
      <style>{`
        .month-custom-row > td {
          background-color: #e0e0e0 !important;
        }
      `}</style>
    </Paper>
  );
}
