import {
  Box,
  IconButton,
  Typography,
  Table as TableMui,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import React, { Fragment, useState } from "react";
import { Table } from "antd";
import { Delete, Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";

export default function PhaseTable({
  department,
  month,
  date,
  shift,
  productionScope,
  isOtherTask,
  handleOpen,
}: {
  department: any;
  month?: string;
  date?: number;
  shift?: number;
  productionScope: any;
  isOtherTask?: boolean;
  handleOpen: (record: any) => void;
}) {
  const queryClient = useQueryClient();
  const [expandedRowKey, setExpandedRowKey] = useState<React.Key | null>(null);
  const productionScopeId = productionScope?._id || productionScope;
  const departmentId = department?._id || department;

  // Nếu có date thì dùng API mới, không thì dùng API cũ
  const useNewApi = date != null;

  const { data: phaseDocs = [] } = useQuery({
    queryKey: [
      useNewApi ? "materialcostused-phases-by-date" : "materialcostused-phases",
      departmentId,
      month,
      date,
      shift,
      month,
      productionScopeId,
      isOtherTask,
    ],
    queryFn: async () => {
      if (useNewApi) {
        const res = await api.get(`/materialcostuseds/phases-by-date`, {
          params: {
            department: departmentId,
            month,
            date,
            shift,
          },
        });
        return res.data.data;
      } else {
        const res = await api.get(`/materialcostuseds/phases`, {
          params: {
            department: departmentId,
            month,
            productionScope: productionScopeId,
            isOtherTask: !!isOtherTask,
          },
        });
        return res.data.data;
      }
    },
    enabled: !!departmentId && !!month && (useNewApi || !!productionScopeId),
  });

  const renderMaterials = (materials: any[]) => {
    if (!materials || materials.length === 0) return null;

    return (
      <Paper sx={{ margin: "20px" }}>
        <TableMui>
          <TableHead sx={{ backgroundColor: "#dcd7d7fa" }}>
            <TableRow>
              <TableCell>Mã giao khoán</TableCell>
              <TableCell>Mã vật tư</TableCell>
              <TableCell>Tên vật tư, tài sản</TableCell>
              <TableCell>ĐVT</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Đơn giá bình quân</TableCell>
              <TableCell>Chi phí thực hiện</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ backgroundColor: "white" }}>
            {materials.map((group: any, idx: number) => (
              <React.Fragment key={idx}>
                {/* Hàng nhóm - hiển thị mã GK + tổng SL + đơn giá TB */}
                <TableRow>
                  <TableCell>{group?.assignmentCode?.code}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    {group?.assignmentCode?.name || "Vật tư không có định mức"}
                  </TableCell>
                  <TableCell>{group?.assignmentCode?.uom?.name}</TableCell>
                  <TableCell>
                    {formatDecimal(
                      group.materials?.reduce(
                        (sum: number, i: any) => sum + (i?.quantity || 0),
                        0,
                      ) || 0,
                    )}
                  </TableCell>
                  <TableCell>{formattedPrice(group.price)}</TableCell>
                  <TableCell>
                    {formattedPrice(
                      group.materials?.reduce(
                        (sum: number, i: any) => sum + (i?.cost || 0),
                        0,
                      ) || 0,
                    )}
                  </TableCell>
                </TableRow>
                {/* Hàng con - chi tiết từng vật tư */}
                {group.materials?.map((i: any, iIdx: number) => (
                  <TableRow key={iIdx}>
                    <TableCell></TableCell>
                    <TableCell>{i?.material?.code}</TableCell>
                    <TableCell>{i?.material?.name}</TableCell>
                    <TableCell>{i?.material?.uom?.name}</TableCell>
                    <TableCell>{formatDecimal(i.quantity)}</TableCell>
                    <TableCell>
                      {group?.assignmentCode ? "" : formattedPrice(i.price)}
                    </TableCell>
                    <TableCell>{formattedPrice(i.cost)}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </TableMui>
      </Paper>
    );
  };

  const columns = [
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Công đoạn</Typography>,
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      render: (_: any, __: any, index: number) => (
        <Typography>Công đoạn {index + 1}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Mã công đoạn</Typography>,
      width: 150,
      dataIndex: "code",
      key: "code",
      render: (_: any, record: any) => (
        <Typography>{record.phase?.code}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Tên công đoạn</Typography>,
      dataIndex: "name",
      key: "name",
      render: (_: any, record: any) => (
        <Typography>{record.phase?.name}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>ĐVT</Typography>,
      dataIndex: "unit",
      key: "unit",
      align: "center" as const,
      render: (text: string) => <Typography>{text}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sản lượng</Typography>,
      dataIndex: "production",
      key: "production",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      key: "expand",
      width: 60,
      align: "center" as const,
      render: (_: any, record: any) => (
        <IconButton
          onClick={() => {
            setExpandedRowKey((prev) =>
              prev === record._id ? null : record._id,
            );
          }}
        >
          {expandedRowKey === record._id ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "edit",
      key: "edit",
      width: 60,
      align: "center" as const,
      render: (_: any, record: any) => (
        <IconButton
          onClick={() => handleOpen(record)}
          sx={{ color: "#666", "&:hover": { color: "#1976d2" } }}
        >
          <Edit />
        </IconButton>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xóa</Typography>,
      dataIndex: "delete",
      key: "delete",
      width: 60,
      align: "center" as const,
      render: (_: any, record: any) => (
        <IconButton
          onClick={async () => {
            const isConfirmed = await showConfirmAlert(
              "Bạn có chắc muốn xóa công đoạn này không? Không thể hoàn tác.",
            );
            if (isConfirmed.isConfirmed) {
              deleteMutation(record._id);
            }
          }}
          sx={{ color: "#666", "&:hover": { color: "#d32f2f" } }}
        >
          <Delete />
        </IconButton>
      ),
    },
  ];

  const { mutate: deleteMutation } = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/materialcostuseds/${id}`).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-months"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-scopes"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-dates"] });
      queryClient.invalidateQueries({
        queryKey: ["materialcostused-phases-by-date"],
      });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || "Lỗi khi xóa");
    },
  });

  return (
    <Paper sx={{ paddingBottom: "10px" }}>
      {phaseDocs.length > 0 && (
        <Table
          columns={columns}
          dataSource={phaseDocs}
          pagination={false}
          size="small"
          rowKey="_id"
          onHeaderRow={() => ({ className: "custom-header1" })}
          expandable={{
            showExpandColumn: false,
            expandedRowKeys: expandedRowKey ? [expandedRowKey] : [],
            onExpand: (expanded, record) => {
              setExpandedRowKey(expanded ? record._id || null : null);
            },
            expandedRowRender: (record: any) => (
              <Box sx={{ p: 2 }}>{renderMaterials(record.materials || [])}</Box>
            ),
          }}
        />
      )}
      <style>{`
        .custom-header1 > th { background-color: #cfcacafa !important; }
      `}</style>
    </Paper>
  );
}

