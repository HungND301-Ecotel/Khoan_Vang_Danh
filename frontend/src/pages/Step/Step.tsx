import { Add, ArrowDropDown, Delete, Edit, FileDownload, FileUpload, FilterList, Mail, Print, Search } from "@mui/icons-material";
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
import StepModal from "../../components/StepModal/StepModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StepType } from "../../types";
import api from "../../config/api.config";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../components/Alert";
import { TableRowSelection } from 'antd/es/table/interface';
import { TableProps, Table } from 'antd';

export default function Step() {
  const [open, setOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<StepType | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const queryClient = useQueryClient();
  const { data: steps = [] } = useQuery({
    queryKey: ["steps"],
    queryFn: () => api.get("/steps").then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (newStep: Partial<StepType>) =>
      api.post("/steps", newStep).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setOpen(false);
      showSuccessAlert("Thêm thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateStep: Partial<StepType>) =>
      api
        .put(`/steps/${updateStep._id}`, updateStep)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setOpen(false);
      setSelectedStep(null);
      showSuccessAlert("Sửa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

const handleDelete = (id?: string) => {
  if (!id) {
    if (selectedSteps.length === 0) {
      showErrorAlert("Vui lòng chọn ít nhất một bản ghi để xóa");
      return;
    }
    
    showConfirmAlert(`Bạn có muốn xóa ${selectedSteps.length} bản ghi đã chọn?`).then((result) => {
      if (result.isConfirmed) {
        selectedSteps.forEach((stepId) => {
          deleteMutation.mutate(stepId as string);
        });
        setSelectedSteps([]); 
      }
    });
  } else {
    showConfirmAlert("Bạn có muốn xóa bản ghi này?").then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  }
};

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/steps/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      showSuccessAlert("Xóa thành công");
    },
    onError: (error: any) => {
      showErrorAlert(error.response.data.message || error.response || "Lỗi");
    },
  });

  const handleSubmit = (values: Partial<StepType>) => {
    if (selectedStep) {
      updateMutation.mutate({ ...values, _id: selectedStep._id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpen = (step?: StepType) => {
    if (step) {
      setSelectedStep(step);
    } else {
      setSelectedStep(null);
    }
    setOpen(true);
  };

  const columns: TableProps<StepType>['columns'] = [
    {
      title: '',
      dataIndex: 'number',
      key: 'number',
      width: 50,
      render: (value, record, index) => (
        <Typography>{index + 1}</Typography>
      )
    },
    {
      title: <Typography sx={{ fontWeight: 'bold' }}>Bước chống</Typography>,
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Typography sx={{ fontWeight: 'bold' }}>{record.name}</Typography>
      ),
      sorter: (a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', 'vi', { sensitivity: 'base' }),
    },
    {
      title: <Typography sx={{ fontWeight: 'bold' }}>Sửa</Typography>,
      dataIndex: 'edit',
      width: 50,
      render: (_, record) => (
        <IconButton onClick={() => handleOpen(record)}>
          <Edit />
        </IconButton>
      )
    },
  ];

  const rowSelection: TableRowSelection<StepType> = {
    selectedRowKeys: selectedSteps,
    onChange: (newSelectedSteps: React.Key[]) => {
      setSelectedSteps(newSelectedSteps);
    },
  };

  return (
    <Box>
      {/* <Breadcrumbs aria-label="breadcrumb">
        <Typography>Danh mục</Typography>
        <Typography>Bước chống</Typography>
      </Breadcrumbs> */}
      <Box mt={3}>
        <Box>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="h4" sx={{ color: 'blue' }}>
              Bước chống
            </Typography> */}
            <Box display={'flex'} gap={4} mt={2} justifyContent='space-between'>
              <Box display={'flex'} gap={2}>
                <Button variant='contained' color='warning' endIcon={<Add />} onClick={() => handleOpen()}>
                  Tạo mới
                </Button>
                <Button variant='contained' color='error' endIcon={<Delete />} onClick={() => handleDelete()}>
                  Xóa
                </Button>
              </Box>
              <Box display={'flex'} flex={1} gap={2}>
                <Button variant='outlined' color='inherit' startIcon={<FilterList />}>
                  Lọc
                </Button>
                <TextField 
                  fullWidth 
                  size='small'
                  placeholder='Tìm kiếm'
                  onChange={(e) => setSearchValue(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Search sx={{ fontSize: 24 }} />
                      </InputAdornment>
                    )
                  }} 
                />
              </Box>
              <Box display={'flex'} gap={2}>
                <Button variant='outlined' color='inherit' startIcon={<FileUpload />}>
                  Tải lên
                </Button>
                <Button variant='outlined' color='inherit' startIcon={<FileDownload />}>
                  Xuất file
                </Button>
                <Button variant='outlined' color='inherit' startIcon={<Print />}>
                  In
                </Button>
                <Button variant='outlined' color='inherit' startIcon={<Mail />} endIcon={<ArrowDropDown />}>
                  Gửi
                </Button>
              </Box>
            </Box>
          </Box>
          <Table<StepType> 
            rowKey="_id" 
            rowSelection={rowSelection}
            pagination={{
              position: ['bottomCenter'],
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              defaultPageSize: 10,
              showTotal: (total, range) => <div style={{ flex: 1, textAlign: 'left' }}>
                Hiển thị {range[0]}-{range[1]} trên {total} mục
              </div>,
            }} 
            columns={columns} 
            dataSource={steps} 
          />
        </Box>
      </Box>
      <StepModal
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        selectedStep={selectedStep}
      />
    </Box>
  );
}