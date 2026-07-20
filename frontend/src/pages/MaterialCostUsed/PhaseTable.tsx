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
  productionScope,
  isOtherTask,
  handleOpen,
}: {
  department: string;
  month?: string;
  productionScope: any;
  isOtherTask?: boolean;
  handleOpen: (record: any) => void;
}) {
  const queryClient = useQueryClient();
  const [expandedRowKey, setExpandedRowKey] = useState<React.Key | null>(null);
  const productionScopeId = productionScope?._id || productionScope;

  const { data: phaseDocs = [] } = useQuery({
    queryKey: [
      "materialcostused-phases",
      department,
      month,
      productionScopeId,
      isOtherTask,
    ],
    queryFn: async () => {
      const res = await api.get(`/materialcostuseds/phases`, {
        params: {
          department,
          month,
          productionScope: productionScopeId,
          isOtherTask: !!isOtherTask,
        },
      });
      return res.data.data;
    },
    enabled: !!department && !!month && !!productionScopeId,
  });

  const innerColumns = [
    {
      title: "",
      width: 120,
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      render: (text: string, item: any, index: number) => (
        <Typography>Công đoạn {index + 1}</Typography>
      ),
    },
    {
      title: <Typography>Mã công đoạn</Typography>,
      width: 150,
      dataIndex: "code",
      key: "code",
      render: (text: string, item: any) => (
        <Typography>{item.phase?.code}</Typography>
      ),
    },
    {
      title: <Typography>Tên công đoạn</Typography>,
      dataIndex: "name",
      key: "name",
      render: (text: string, item: any) => (
        <Typography>{item.phase?.name}</Typography>
      ),
    },
    {
      title: <Typography>ĐVT</Typography>,
      dataIndex: "unit",
      key: "unit",
      align: "center" as const,
      render: (text: string) => <Typography>{text}</Typography>,
    },
    {
      title: <Typography>Sản lượng</Typography>,
      dataIndex: "production",
      key: "production",
      align: "center" as const,
      render: (value: number) => (
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
    {
      title: <Typography>Xem</Typography>,
      key: "expand",
      width: 60,
      align: "center" as const,
      render: (_: any, record: any) => {
        const expanded = expandedRowKey === record._id;

        return (
          <IconButton
            onClick={() => {
              if (expanded) {
                setExpandedRowKey(null);
              } else {
                setExpandedRowKey(record._id);
              }
            }}
          >
            {expanded ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        );
      },
    },
    {
      title: <Typography>Sửa</Typography>,
      dataIndex: "edit",
      key: "edit",
      width: 60,
      align: "center" as const,
      render: (_: any, record: any) => (
        <IconButton
          onClick={() =>
            handleOpen({
              ...record,
              department,
              month,
              productionScope,
              isOtherTask: false,
            })
          }
          sx={{
            color: "#666",
            "&:hover": {
              color: "#1976d2",
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <Edit />
        </IconButton>
      ),
    },
    {
      title: <Typography>Xóa</Typography>,
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
          sx={{
            color: "#666",
            "&:hover": {
              color: "#d32f2f",
              backgroundColor: "rgba(211,47,47,0.04)",
            },
          }}
        >
          <Delete />
        </IconButton>
      ),
    },
  ];

  // Nhánh "Công việc khác" - chỉ 1 document duy nhất, không có phase, chỉ hiển thị bảng materials
  if (isOtherTask) {
    const doc = phaseDocs[0];
    return (
      <Paper sx={{ paddingBottom: "10px" }}>
        <MaterialsTable materials={doc?.materials || []} />
      </Paper>
    );
  }

  const { mutate: deleteMutation, isPending: isDeletePending } = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/materialcostuseds/${id}`).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materialcostuseds"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-months"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-scopes"] });
      queryClient.invalidateQueries({ queryKey: ["materialcostused-phases"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi khi xóa";
      console.error(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  return (
    <Paper sx={{ paddingBottom: "10px" }}>
      {phaseDocs.length > 0 && (
        <Table
          columns={innerColumns}
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
              <Box sx={{ p: 2 }}>
                <MaterialsTable materials={record.materials || []} />
              </Box>
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

// Tách bảng materials thành component dùng chung cho cả 2 nhánh (thường + OtherTask)
function MaterialsTable({ materials }: { materials: any[] }) {
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
          {materials.map((m: any, idx: number) => (
            <Fragment key={idx}>
              <TableRow>
                <TableCell>{m?.assignmentCode?.code}</TableCell>
                <TableCell></TableCell>
                <TableCell>
                  {m?.assignmentCode?.name || "Vật tư không có định mức"}
                </TableCell>
                <TableCell>{m?.assignmentCode?.uom?.name}</TableCell>
                <TableCell>
                  {formatDecimal(
                    m.materials.reduce(
                      (sum: number, i: any) => sum + (i?.quantity || 0),
                      0,
                    ),
                  )}
                </TableCell>
                <TableCell>{formattedPrice(m.price)}</TableCell>
                <TableCell>
                  {formattedPrice(
                    m.materials.reduce(
                      (sum: number, i: any) => sum + (i?.cost || 0),
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
              {m.materials.map((i: any, iIdx: number) => (
                <TableRow key={iIdx}>
                  <TableCell></TableCell>
                  <TableCell>{i?.material?.code}</TableCell>
                  <TableCell>{i?.material?.name}</TableCell>
                  <TableCell>{i?.material?.uom?.name}</TableCell>
                  <TableCell>{formatDecimal(i.quantity)}</TableCell>
                  <TableCell>
                    {m?.assignmentCode ? "" : formattedPrice(i.price)}
                  </TableCell>
                  <TableCell>{formattedPrice(i.cost)}</TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </TableMui>
    </Paper>
  );
}
