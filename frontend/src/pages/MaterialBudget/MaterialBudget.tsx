import React, { Key, useState } from "react";
import { Add, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Breadcrumbs, IconButton, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../config/api.config";
import { MaterialBudgetOutputType } from "../../types";
import { showErrorAlert } from "../../components/Alert";
import { TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import MonthTable from "./MonthTable";
import { formattedPrice } from "../../utils/helpers";
import PageAction from "../../components/Common/PageAction";
export default function MaterialBudgetCosts() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: materialbudgets = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: ["materialbudgets", searchValue, page, limit],
      queryFn: async () => {
        try {
          const res = await api.get(
            `/materialbudgets?q=${searchValue}&page=${page}&limit=${limit}`,
          );
          return res.data?.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Lỗi khi tải dữ liệu";
          showErrorAlert(errorMessage);
        }
      },
    });

  const handleView = (materialbudget: MaterialBudgetOutputType) => {
    const id = materialbudget?._id;
    if (!id) return;

    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const expandedRowRender = (record: MaterialBudgetOutputType) => (
    <Box>
      <MonthTable department={record.department} />
    </Box>
  );

  const columns: TableProps<MaterialBudgetOutputType>["columns"] = [
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
      dataIndex: "totalBudgetCost",
      key: "totalBudgetCost",
      width: 50,
      render: (text: string, item: any) => {
        const total = item.totalBudgetCost || 0;
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
  ];

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const rowSelection: TableRowSelection<MaterialBudgetOutputType> = {
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
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              handleClearSearch={handleClearSearch}
              isLoading={isLoading}
              totalItems={materialbudgets.totalDocs}
            />
          </Box>
          <CustomTable<MaterialBudgetOutputType>
            data={materialbudgets.data}
            total={materialbudgets.totalDocs}
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
    </Box>
  );
}
