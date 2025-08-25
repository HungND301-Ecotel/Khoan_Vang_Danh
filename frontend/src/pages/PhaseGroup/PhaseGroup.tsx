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
  Search,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import PhaseGroupModal from "../../components/PhaseGroupModal/PhaseGroupModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PhaseGroupType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from "antd/es/table/interface";
import { TableProps, Table } from "antd";

export default function PhaseGroup() {
  const [open, setOpen] = useState(false);
  const [selectedPhaseGroup, setSelectedPhaseGroup] =
    useState<PhaseGroupType | null>(null);
  const [selectedPhaseGroups, setSelectedPhaseGroups] = useState<React.Key[]>(
    []
  );
  const [searchValue, setSearchValue] = useState("");

  const queryClient = useQueryClient();
  const { data: phasegroups = [] } = useQuery({
    queryKey: ["phasegroups"],
    queryFn: () => api.get("/phasegroups").then((res) => res.data.data),
  });

  const filteredData = phasegroups.filter(
    (phaseGroup: PhaseGroupType) =>
      phaseGroup.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      phaseGroup.code?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (newPhaseGroup: Partial<PhaseGroupType>) =>
      api.post("/phasegroups", newPhaseGroup).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatePhaseGroup: Partial<PhaseGroupType>) =>
      api
        .put(`/phasegroups/${updatePhaseGroup._id}`, updatePhaseGroup)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setOpen(false);
      setSelectedPhaseGroup(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  
  const deleteMultipleMutation = useMutation({
    mutationFn: (ids: string[]) => {
    
      return Promise.all(
        ids.map((id) =>
          api.delete(`/phasegroups/${id}`).then((res) => res.data)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      setSelectedPhaseGroups([]);
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || "Có lỗi xảy ra khi xóa");
    },
  });

  
  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/phasegroups/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phasegroups"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      console.error("Lỗi khi xóa:", error);
      showErrorAlert(error.response?.data?.message || error.response || "Lỗi");
    },
  });

  const handleDeleteMultiple = () => {
    if (selectedPhaseGroups.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }

    const confirmMessage =
      selectedPhaseGroups.length === 1
        ? "Bạn có muốn xóa 1 bản ghi? Hành động này không thể hoàn tác."
        : `Bạn có muốn xóa ${selectedPhaseGroups.length} bản ghi? Hành động này không thể hoàn tác.`;

    showConfirmAlert(confirmMessage).then((result) => {
      if (result.isConfirmed) {
        deleteMultipleMutation.mutate(selectedPhaseGroups as string[]);
      }
    });
  };

  const handleDeleteSingle = (id: string) => {
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteSingleMutation.mutate(id);
      }
    });
  };

  const handleSubmit = (values: Partial<PhaseGroupType>) => {
    if (selectedPhaseGroup) {
      updateMutation.mutate({ ...values, _id: selectedPhaseGroup._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (phaseGroup?: PhaseGroupType) => {
    if (phaseGroup) {
      setSelectedPhaseGroup(phaseGroup);
    } else {
      setSelectedPhaseGroup(null);
    }
    setOpen(true);
  };

  const columns: TableProps<PhaseGroupType>["columns"] = [
    {
      title: "",
      dataIndex: "number",
      key: "number",
      width: 50,
      render: (value, record, index) => <Typography>{index + 1}</Typography>,
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Mã nhóm công đoạn</Typography>
      ),
      dataIndex: "code",
      key: "code",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.code}</Typography>
      ),
      sorter: (a, b) =>
        (a.code ?? "").localeCompare(b.code ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: (
        <Typography sx={{ fontWeight: "bold" }}>Tên nhóm công đoạn</Typography>
      ),
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Typography sx={{ fontWeight: "bold" }}>{record.name}</Typography>
      ),
      sorter: (a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        }),
    },
    {
      title: <Typography sx={{ fontWeight: "bold" }}>Sửa</Typography>,
      dataIndex: "actions",
      width: 120,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <IconButton onClick={() => handleOpen(record)}>
            <Edit color="primary" />
          </IconButton>
          {/* <IconButton onClick={() => {
            if (record._id) {
              handleDeleteSingle(record._id);
            }
          }}>
            <Delete color="error" />
          </IconButton> */}
        </Box>
      ),
    },
  ];

  const rowSelection: TableRowSelection<PhaseGroupType> = {
    selectedRowKeys: selectedPhaseGroups,
    onChange: (newSelectedPhaseGroups: React.Key[]) => {
      setSelectedPhaseGroups(newSelectedPhaseGroups);
    },
  };

  return (
    <Box>
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Nhóm công đoạn
            </Typography> */}
            <Box display={"flex"} gap={4} mt={2} justifyContent="space-between">
              <Box display={"flex"} gap={2}>
                <Button
                  variant="contained"
                  color="warning"
                  endIcon={<Add />}
                  onClick={() => handleOpen()}
                >
                  Tạo mới
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  endIcon={<Delete />}
                  onClick={handleDeleteMultiple}
                  disabled={selectedPhaseGroups.length === 0}
                >
                  Xóa ({selectedPhaseGroups.length})
                </Button>
              </Box>
              <Box display={"flex"} flex={1} gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FilterList />}
                >
                  Lọc
                </Button>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm"
                  onChange={(e) => setSearchValue(e.target.value)}
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
                >
                  Tải lên
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<FileDownload />}
                >
                  Xuất file
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Print />}
                >
                  In
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Mail />}
                  endIcon={<ArrowDropDown />}
                >
                  Gửi
                </Button>
              </Box>
            </Box>
          </Box>
          <Table<PhaseGroupType>
            rowKey="_id"
            rowSelection={rowSelection}
            pagination={{
              position: ["bottomCenter"],
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              defaultPageSize: 10,
              showTotal: (total, range) => (
                <div style={{ flex: 1, textAlign: "left" }}>
                  Hiển thị {range[0]}-{range[1]} trên {total} mục
                </div>
              ),
            }}
            columns={columns}
            dataSource={filteredData}
          />
        </Box>
      </Box>
      <PhaseGroupModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedPhaseGroup={selectedPhaseGroup}
      />
    </Box>
  );
}
