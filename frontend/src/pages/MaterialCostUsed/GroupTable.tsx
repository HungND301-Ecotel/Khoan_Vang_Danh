import { Delete, Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Table } from "antd";
import React, { useState } from "react";
import PhaseTable from "./PhaseTable";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { formattedPrice } from "../../utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function GroupTable({
  handleOpen,
  department,
  month,
}: {
  handleOpen: (record: any) => void;
  department?: any;
  month?: string;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);

  const departmentId = department?._id || department;
  const queryClient = useQueryClient();

  const { data: scopes = [] } = useQuery({
    queryKey: ["materialcostused-scopes", departmentId, month],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/scopes`, {
        params: { department: departmentId, month },
      });
      return res.data.data;
    },
    enabled: !!departmentId && !!month,
  });

  const { mutate: deleteOtherTaskMutation } =
    useMutation({
      mutationFn: async (id: string) => {
        return api.delete(`/othermaterialcosts/${id}`).then((res) => res.data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
        queryClient.invalidateQueries({
          queryKey: ["materialcostused-months"],
        });
        queryClient.invalidateQueries({
          queryKey: ["materialcostused-scopes"],
        });
        queryClient.invalidateQueries({
          queryKey: ["materialcostused-phases"],
        });
        showSuccessAlert("Xóa thành công");
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.message || error.message || "Lỗi khi xóa";
        console.error(errorMessage);
        showErrorAlert(errorMessage);
      },
    });

  const handleView = (record: any) => {
    const id = record?._id;
    if (!id) return;
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  // Chủ động fetch đầy đủ dữ liệu (kèm materials) trước khi mở modal sửa cho "Công việc khác"
  const handleEditOtherTask = async (record: any) => {
    try {
      setEditLoadingId(record._id);
      const result = await queryClient.fetchQuery({
        queryKey: [
          "materialcostused-phases",
          departmentId,
          month,
          record._id,
          true,
        ],
        queryFn: async () => {
          const res = await api.get(`/materialcostuseds/phases`, {
            params: {
              department: departmentId,
              month,
              productionScope: record._id,
              isOtherTask: true,
            },
          });
          return res.data.data;
        },
      });

      const fullData = result?.[0]; // API trả về mảng 1 phần tử cho isOtherTask
      if (!fullData) {
        showErrorAlert("Không tìm thấy dữ liệu");
        return;
      }

      handleOpen({
        ...fullData,
        department,
        month,
        isOtherTask: true,
      });
    } catch (err) {
      showErrorAlert("Lỗi khi tải dữ liệu để sửa");
    } finally {
      setEditLoadingId(null);
    }
  };

  const expandedRowRender = (record: any) => (
    <Box sx={{ padding: "10px" }}>
      <PhaseTable
        department={departmentId}
        month={month}
        productionScope={
          record.isOtherTask ? record._id : record.productionScope
        }
        isOtherTask={record.isOtherTask}
        handleOpen={handleOpen}
      />
    </Box>
  );

  const innerColumns = [
    {
      title: "",
      dataIndex: "productionScope",
      key: "productionScope",
      render: (text: any, item: any) => (
        <Typography fontWeight="bold">
          {item.isOtherTask ? "Công việc khác" : item.productionScope?.code}
        </Typography>
      ),
    },
    {
      title: "",
      width: 150,
      dataIndex: "total",
      key: "total",
      render: (text: string, item: any) => (
        <Typography sx={{ fontWeight: "bold" }}>
          {formattedPrice(item.totalUsedCost)}
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
    {
      title: "",
      dataIndex: "add",
      key: "add",
      width: 50,
      align: "center" as const,
      render: (_: any, record: any) =>
        record.isOtherTask ? (
          <IconButton
            onClick={() => handleEditOtherTask(record)}
            disabled={editLoadingId === record._id}
            sx={{
              color: "#666",
              "&:hover": {
                color: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.04)",
              },
            }}
          >
            {editLoadingId === record._id ? (
              <CircularProgress size={20} />
            ) : (
              <Edit />
            )}
          </IconButton>
        ) : null,
    },
    {
      title: "",
      dataIndex: "delete",
      key: "delete",
      width: 50,
      align: "center" as const,
      render: (_: any, record: any) =>
        record.isOtherTask ? (
          <IconButton
            onClick={async () => {
              const isConfirmed = await showConfirmAlert(
                "Bạn có chắc muốn xóa bản ghi này không?. Không thể hoàn tác.",
              );
              if (isConfirmed.isConfirmed) {
                deleteOtherTaskMutation(record._id);
              }
            }}
            sx={{
              color: "#666",
              "&:hover": {
                color: "#1976d2",
                backgroundColor: "rgba(42, 58, 75, 0.04)",
              },
            }}
          >
            <Delete />
          </IconButton>
        ) : null,
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
            setExpandedRow(expanded ? record._id || null : null);
          },
          expandedRowRender,
          showExpandColumn: false,
        }}
        onRow={() => ({ className: "custom-row" })}
        rowClassName={(record, index) =>
          index === 0 ? "custom-row first-data-row" : "custom-row"
        }
      />
      <style>{`
        .custom-row > td { background-color: #dcd7d7fa !important; }
      `}</style>
    </Paper>
  );
}
