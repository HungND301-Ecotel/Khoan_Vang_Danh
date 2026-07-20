import React, { Key, useState } from "react";
import { Add, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Breadcrumbs, IconButton, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import {
  InitialPlannedCostInputType,
  InitialPlannedCostOutputType,
} from "../../types";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { Table, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import InitialPlannedCostModal from "./InitialPlannedCostModal/InitialPlannedCostModal";
import MonthTable from "./MonthTable";
import { formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
import useMinimizedModal from "../../hooks/useMinimizedModal";
export default function InitialPlannedCosts() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { minimizedData, handleMinimize, clearMinimize } = useMinimizedModal<
    Partial<InitialPlannedCostInputType>
  >(setOpen, "Chi phí kế hoạch ban đầu");

  const queryClient = useQueryClient();

  const { data: initialplannedcosts = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["initialplannedcosts", searchValue, page, limit],
      queryFn: async () => {
        try {
          const res = await api.get(
            `/initialplannedcosts?q=${searchValue}&page=${page}&limit=${limit}`,
          );
          return res.data?.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Lỗi khi tải dữ liệu";
          showErrorAlert(errorMessage);
        }
      },
    });

  const createMutation = useMutation({
    mutationFn: (payload: { items: any[] }) =>
      api.post("/initialplannedcosts/batch", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initialplannedcosts"] });
      queryClient.invalidateQueries({
        queryKey: ["initialplannedcost-months"],
      });
      queryClient.invalidateQueries({
        queryKey: ["initialplannedcost-scopes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["initialplannedcost-phases"],
      });
      setOpen(false);
      setSelected(null);
      clearMinimize();
      showSuccessAlert("Lưu thành công");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Lỗi khi lưu";
      console.log(errorMessage);
      showErrorAlert(errorMessage);
    },
  });

  const {
    mutate: handleDeleteByDepartmentMutation,
    isPending: isDeleteDeptPending,
  } = useMutation({
    mutationFn: async (departmentIds: Key[]) =>
      api
        .delete(`/initialplannedcosts/department`, { data: { departmentIds } })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initialplannedcosts"] });
      showSuccessAlert("Xóa toàn bộ dữ liệu phân xưởng thành công");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi khi xóa";
      showErrorAlert(errorMessage);
    },
  });

  const handleDeleteDepartment = () => {
    showConfirmAlert(
      "Bạn có chắc muốn xóa TOÀN BỘ dữ liệu của phân xưởng này (tất cả các tháng)? Không thể hoàn tác.",
    ).then((result) => {
      if (result.isConfirmed) {
        handleDeleteByDepartmentMutation(selectedRows);
      }
    });
  };

  const handleSubmit = (items: any[]) => {
    createMutation.mutate({ items });
  };

  const handleOpen = (initialplannedcost?: any) => {
    if (initialplannedcost) {
      setSelected(initialplannedcost);
    } else {
      setSelected(null);
      clearMinimize();
    }
    setOpen(true);
  };

  const handleView = (initialplannedcost: InitialPlannedCostOutputType) => {
    const id = initialplannedcost?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: InitialPlannedCostOutputType) => (
    <Box>
      <MonthTable department={record.department} handleOpen={handleOpen} />
    </Box>
  );

  const columns: TableProps<InitialPlannedCostOutputType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 60,
      render: (value, record, index) => (
        <Typography>{(page - 1) * limit + index + 1}</Typography>
      ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Phân xưởng </Typography>,
      dataIndex: "department",
      key: "department",
      width: 300,
      render: (_, record) => (
        <Typography>
          {record.department?.name || record.department?.code}
        </Typography>
      ),
      sorter: (a, b) =>
        (a.department?.name ?? "").localeCompare(
          b.department?.name ?? "",
          "vi",
          {
            sensitivity: "base",
          },
        ),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Thời gian</Typography>,
      dataIndex: "month",
      key: "month",
      width: 350,
      render: (text: string, item: any) => <Typography>{text}</Typography>,
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Chi phí</Typography>,
      dataIndex: "totalInitialPlannedCost",
      key: "totalInitialPlannedCost",
      width: 50,
      render: (text: string, item: any) => {
        const total = item.totalInitialPlannedCost || 0;
        return <Typography> {formattedPrice(total)}</Typography>;
      },
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Xem</Typography>,
      dataIndex: "view",
      key: "view",
      width: 50,
      align: "center",
      render: (_, record) => (
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
      title: <Typography sx={{ fontWeight: "bold" }}>Thêm</Typography>,
      dataIndex: "add",
      key: "add",
      width: 50,
      align: "center",
      render: (_, record) => (
        <IconButton
          onClick={() =>
            handleOpen({
              department: record.department,
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
          <Add />
        </IconButton>
      ),
    },
  ];

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const rowSelection: TableRowSelection<InitialPlannedCostOutputType> = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows: React.Key[]) => {
      setSelectedRows(newSelectedRows);
    },
  };

  return (
    <Box
      sx={{
        px: 5, // horizontal = 32px
        py: 1, // vertical = 8px
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Thống kê vận hành</Typography>
        <Typography>Chi phí kế hoạch ban đầu </Typography>
      </Breadcrumbs>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ color: (theme) => custom_theme.palette.table_name.main }}
            >
              Chi phí kế hoạch ban đầu
            </Typography>
            <PageAction
              selectedIds={selectedRows}
              handleDelete={handleDeleteDepartment}
              deleteMutation={handleDeleteByDepartmentMutation}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleOpen={handleOpen}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={initialplannedcosts.totalDocs}
            />
          </Box>
          <CustomTable<InitialPlannedCostOutputType>
            data={initialplannedcosts.data}
            total={initialplannedcosts.totalDocs}
            page={page}
            limit={limit}
            columns={columns}
            rowSelection={rowSelection}
            onPageChange={(p, ps) => {
              setPage(p);
              setLimit(ps);
            }}
            isLoading={isLoading}
            searchValue={searchValue}
            handleClearSearch={handleClearSearch}
            expandable={{
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              onExpand: (expanded, record) => {
                setExpandedRow(expanded ? record._id || null : null);
              },
              expandedRowRender,
              showExpandColumn: false,
            }}
          />
        </Box>
      </Box>
      <InitialPlannedCostModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selected={selected}
        minimizedData={minimizedData}
        onMinimize={handleMinimize}
        clearMinimize={clearMinimize}
      />
    </Box>
  );
}
