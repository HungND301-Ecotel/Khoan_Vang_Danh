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
import custom_theme from '../../theme';
import CustomTable from "../../components/CustomTable/CustomTable";

export default function Materialunitprice() {
  const queryClient = useQueryClient();
  const [data, setData] = useState<MaterialAssignmentOutputType[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data: materialAssignments = { totalDocs: 0, data: [] }, isLoading } = useQuery({
    queryKey: ["materialAssignments", searchValue, page, limit],
    queryFn: () =>
      api.get(`/materialassignments/group?q=${searchValue}&page=${page}&limit=${limit}`).then((res) => {
        return res.data.data;
      }),
  });

  const treeData = useMemo(() => {
    return materialAssignments.data.map((assignment: MaterialAssignmentOutputType, i: number) => ({

      // Header (parent row)
      key: assignment._id,
      _id: assignment._id,
      number: (page - 1) * limit + i + 1,
      materialCode: '',
      assignmentCode: assignment.code,
      name: assignment.name,
      price: assignment.price,

      // Children
      children: (assignment.materials || []).map((m, idx) => ({
        key: `${assignment?._id}-${idx}`,
        number: '',
        materialCode: m.code,
        assignmentCode: '',
        name: m.name,
        uom: m.uom?.name,
        quantity: m.quantity,
        price: m.currentPrice,
      }))
    }));
  }, [materialAssignments.data]);

  const columns: TableProps<any>["columns"] = [
    {
      title: "",
      dataIndex: 'number',
      width: 50,
      render: (value, record) => {
        return <Typography>{value}</Typography>;
      }
    },
    {
      title: <Typography fontWeight="bold">{"Mã vật tư"}</Typography>,
      dataIndex: "materialCode",
      width: 180,
      render: (value, record) => {
        return <Typography >{value}</Typography>;
      }
    },
    {
      title: <Typography fontWeight="bold">Mã giao khoán</Typography>,
      dataIndex: "assignmentCode",
      width: 180,
      render: (value, record) => {
        return <Typography >{value}</Typography>;
      }
    },
    {
      title: <Typography fontWeight="bold">Tên vật tư</Typography>,
      dataIndex: "name",
      render: (value, record) => {
        return <Typography>{value}</Typography>;
      }
    },
    {
      title: <Typography fontWeight="bold">ĐVT</Typography>,
      dataIndex: "uom",
      align: "center",
      render: v => <Typography>{v}</Typography>
    },
    {
      title: <Typography fontWeight="bold">Số lượng</Typography>,
      dataIndex: "quantity",
      align: "center",
      render: v => <Typography>{v ? (Number(v.toFixed(0))).toLocaleString() : ""}</Typography>
    },
    {
      title: <Typography fontWeight="bold">Đơn giá bình quân năm</Typography>,
      dataIndex: "price",
      align: "center",
      render: v => <Typography>{v ? (Number(v.toFixed(0))).toLocaleString() : ""}</Typography>
    }
  ];


  const handleClearSearch = () => {
    setSearchValue('')
  }

  const parentKeys = useMemo(() => {
    return materialAssignments.data.map((a: any) => a._id);
  }, [materialAssignments.data]);

  return (
    <Box sx={{
      px: 5,
      py: 1,
    }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Typography>Đơn giá và định mức</Typography>
        <Typography>Đơn giá vật tư giao khoán</Typography>
      </Breadcrumbs>
      <Typography variant="h4" sx={{ color: (theme) => custom_theme.palette.table_name.main, mt: 2 }}>
        Đơn giá vật tư giao khoán
      </Typography>
      <Box mt={3}>
        <Box sx={{ mb: 2 }}>
          <Box
            display={"flex"}
            gap={4}
            mt={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display={"flex"} flex={1} gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FilterList />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Lọc
              </Button>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                sx={{ backgroundColor: (theme) => custom_theme.palette.table_filter_box.main }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search sx={{ fontSize: 24 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box display={"flex"} gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FileUpload />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Tải lên
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FileDownload />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Xuất file
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Print />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                In
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Mail />}
                endIcon={<ArrowDropDown />}
                sx={{
                  border: "none",
                  boxShadow: custom_theme.customShadows.tableFunctional,
                  backgroundColor: (theme) => custom_theme.palette.table_functional_button.main,
                  "&:hover": {
                    backgroundColor: (theme) => custom_theme.palette.table_functional_button.dark,
                    boxShadow: custom_theme.customShadows.tableFunctionalHover,
                  },
                  fontFamily: "Roboto, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                }}
              >
                Gửi
              </Button>
            </Box>
          </Box>
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
            showExpandColumn: false,  // ❌ bỏ cột icon
            expandIcon: () => null,
            rowExpandable: (record) => record.children?.length > 0
          }}
        />
      </Box>
    </Box>
  );
}