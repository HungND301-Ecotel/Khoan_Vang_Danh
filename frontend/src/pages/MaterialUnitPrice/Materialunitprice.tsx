import {
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Paper,
  TableContainer,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState, useMemo } from "react";
import api from "../../config/api.config";
import {
  AssignmentCodeInputType,
  MaterialAssignmentInputType,
  MaterialAssignmentOutputType,
  Materials,
} from "../../types";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { Table, TableProps } from "antd";
import {
  Add,
  ArrowDropDown,
  Delete,
  Edit,
  FileDownload,
  FileUpload,
  FilterList,
  Mail,
  Print,
  Visibility,
  Search,
} from "@mui/icons-material";
import custom_theme from "../../theme";
import CustomTable from "../../components/CustomTable/CustomTable";
import FieldMonthYear from "../../ui/FieldMonth_Year";
import { formatDecimal, formattedPrice } from "../../utils/helpers";
import { render } from "react-dom";
import PageAction from "../../components/Common/PageAction";

export default function Materialunitprice() {
  const queryClient = useQueryClient();
  const [data, setData] = useState<MaterialAssignmentOutputType[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState("");

  const { data: materialAssignments = { totalDocs: 0, data: [] }, isLoading } =
    useQuery({
      queryKey: [
        "materialAssignments",
        searchValue,
        page,
        limit,
        selectedMonth,
      ],
      queryFn: () =>
        api
          .get(
            `/materialassignments/group?q=${searchValue}&month=${selectedMonth}&page=${page}&limit=${limit}`,
          )
          .then((res) => {
            return res.data.data;
          }),
    });

  const treeData = useMemo(() => {
    return materialAssignments.data.map((assignment: any, i: number) => ({
      key: assignment._id,
      _id: assignment._id,
      number: assignment._id === "unassigned" ? "" : (page - 1) * limit + i + 1,

      materialCode: "",
      assignmentCode: assignment._id === "unassigned" ? "—" : assignment.code,

      name: assignment.name,
      price: assignment.price,

      children: (assignment.materials || []).map((m: any, idx: number) => ({
        key: `${assignment._id}-${idx}`,
        number: "",
        materialCode: m.code,
        assignmentCode: "",
        name: m.name,
        uom: m.uom?.name,
        quantity: m.quantity,
        price: m.currentPrice,
      })),
    }));
  }, [materialAssignments.data, page, limit]);

  const columns: TableProps<any>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      width: 50,
      render: (value, record) => {
        return <Typography>{value}</Typography>;
      },
    },
    {
      title: <Typography fontWeight="bold">{"Mã vật tư"}</Typography>,
      dataIndex: "materialCode",
      width: 180,
      render: (value, record) => {
        return <Typography>{value}</Typography>;
      },
    },
    {
      title: <Typography fontWeight="bold">Mã giao khoán</Typography>,
      dataIndex: "assignmentCode",
      width: 180,
      render: (value, record) => {
        return <Typography>{value}</Typography>;
      },
    },
    {
      title: <Typography fontWeight="bold">Tên vật tư</Typography>,
      dataIndex: "name",
      render: (value, record) => {
        return <Typography>{value}</Typography>;
      },
    },
    {
      title: <Typography fontWeight="bold">ĐVT</Typography>,
      dataIndex: "uom",
      align: "center",
      render: (v) => <Typography>{v}</Typography>,
    },
    {
      title: <Typography fontWeight="bold">Số lượng</Typography>,
      dataIndex: "quantity",
      align: "center",
      render: (v) => <Typography>{formatDecimal(v)}</Typography>,
    },
    {
      title: <Typography fontWeight="bold">Đơn giá bình quân năm</Typography>,
      dataIndex: "price",
      align: "center",
      render: (v) => <Typography>{formattedPrice(v)}</Typography>,
    },
  ];

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const parentKeys = useMemo(() => {
    return materialAssignments.data.map((a: any) => a._id);
  }, [materialAssignments.data]);

  return (
    <Box
      sx={{
        px: 5,
        py: 1,
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Đơn giá và định mức</Typography>
        <Typography>Đơn giá vật tư giao khoán</Typography>
      </Breadcrumbs>
      <Typography
        variant="h4"
        sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}
      >
        Đơn giá vật tư giao khoán
      </Typography>
      <Box mt={3}>
        <Box sx={{ mb: 2 }}>
          <PageAction
            selectedIds={[]}
            handleDelete={undefined}
            deleteMutation={undefined}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            exportExcel={undefined}
            importFile={undefined}
            handleOpen={undefined}
            handleClearSearch={handleClearSearch}
            isLoading={isLoading}
            totalItems={materialAssignments.totalDocs}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        </Box>

        <CustomTable<any>
          data={treeData}
          total={materialAssignments.totalDocs}
          page={page}
          limit={limit}
          columns={columns}
          // rowSelection={rowSelection}
          onPageChange={(p, ps) => {
            setPage(p);
            setLimit(ps);
          }}
          isLoading={isLoading}
          searchValue={searchValue}
          handleClearSearch={handleClearSearch}
          expandable={{
            expandedRowKeys: parentKeys,
            defaultExpandAllRows: true,
            showExpandColumn: false, // ❌ bỏ cột icon
            expandIcon: () => null,
            rowExpandable: (record) => record.children?.length > 0,
          }}
        />
      </Box>
    </Box>
  );
}
