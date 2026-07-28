import { Visibility, VisibilityOff, Edit, Delete } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { Table } from "antd";
import React, { useState } from "react";
import OtherTaskMaterialsTable from "./OtherTaskMaterialsTable";
import { formattedPrice } from "../../utils/helpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import api from "../../config/api.config";

export default function OtherTaskShiftTable({
  handleOpen,
  department,
  month,
  date,
}: {
  handleOpen: (record: any) => void;
  department?: any;
  month: string;
  date: number;
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const departmentId = department?._id || department;

  // Lấy danh sách ca từ OtherMaterialCost theo date
  const { data: otherTasks = [], isLoading } = useQuery({
    queryKey: ["othermaterialcosts-shifts", departmentId, month, date],
    queryFn: async () => {
      const res = await api.get(`/othermaterialcosts`, {
        params: { department: departmentId, month },
      });
      const data = res.data.data || [];
      // Filter by date và group by shift
      const filtered = data.filter((item: any) => item.date === date);
      const shiftMap = new Map();
      filtered.forEach((item: any) => {
        const shift = item.shift;
        if (!shiftMap.has(shift)) {
          shiftMap.set(shift, {
            shift,
            totalShiftCost: 0,
            records: [],
          });
        }
        const shiftEntry = shiftMap.get(shift);
        shiftEntry.totalShiftCost += item.totalUsedCost || 0;
        shiftEntry.records.push(item);
      });
      return Array.from(shiftMap.values()).sort((a, b) => a.shift - b.shift);
    },
    enabled: !!departmentId && !!month && date != null,
  });

  // Xóa OtherMaterialCost
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/othermaterialcosts/${id}`),
    onSuccess: () => {
      // Invalidate tất cả queries liên quan
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-months"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-scopes"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-dates"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["othermaterialcosts"] });
      queryClient.invalidateQueries({ queryKey: ["othermaterialcosts-dates"] });
      queryClient.invalidateQueries({ queryKey: ["othermaterialcosts-shifts"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Lỗi khi xóa");
    },
  });

  const handleDelete = (record: any) => {
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed && record._id) {
        deleteMutation.mutate(record._id);
      }
    });
  };

  const handleView = (record: any) => {
    const shift = record?.shift;
    if (shift == null) return;
    setExpandedRow((prev) => (prev === shift ? null : shift));
  };

  const expandedRowRender = (record: any) => (
    <Box sx={{ padding: "10px" }}>
      <OtherTaskMaterialsTable
        handleOpen={handleOpen}
        records={record.records}
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
      dataIndex: "totalShiftCost",
      key: "totalShiftCost",
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
    {
      title: "",
      dataIndex: "edit",
      key: "edit",
      width: 50,
      render: (_: any, record: any) => (
        <IconButton
          onClick={() => {
            // Mở modal sửa với record đầu tiên trong records
            if (record.records && record.records.length > 0) {
              handleOpen({ ...record.records[0], isOtherTask: true });
            }
          }}
          sx={{ color: "#666", "&:hover": { color: "#1976d2" } }}
        >
          <Edit sx={{ fontSize: "18px" }} />
        </IconButton>
      ),
    },
    {
      title: "",
      dataIndex: "delete",
      key: "delete",
      width: 50,
      render: (_: any, record: any) => (
        <IconButton
          onClick={() => {
            // Xóa record đầu tiên trong records (hoặc xóa tất cả)
            if (record.records && record.records.length > 0) {
              handleDelete(record.records[0]);
            }
          }}
          sx={{ color: "#666", "&:hover": { color: "#d32f2f" } }}
        >
          <Delete sx={{ fontSize: "18px" }} />
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
        rowKey={(item) => item.shift}
        showHeader={false}
        loading={isLoading}
        expandable={{
          expandedRowKeys: expandedRow != null ? [expandedRow] : [],
          onExpand: (expanded, record) => {
            setExpandedRow(expanded ? record.shift : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({ className: "othershift-custom-row" })}
        rowClassName={(record, index) =>
          index === 0
            ? "othershift-custom-row first-data-row"
            : "othershift-custom-row"
        }
      />
      <style>{`
        .othershift-custom-row > td { background-color: #f0f0f0 !important; }
      `}</style>
    </Paper>
  );
}
