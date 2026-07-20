import { Table, Typography } from "antd";
import { Paper } from "@mui/material";
import { formatDecimal, formattedPrice } from "../../utils/helpers";

export default function AssignmentNormTable({ data }: { data: any }) {
  const innerColumns = [
    {
      title: <Typography>Mã giao khoán</Typography>,
      width: 150,
      dataIndex: "assignmentCode",
      key: "assignmentCode",
      render: (assignmentCode: any) => (
        <Typography>{assignmentCode?.code}</Typography>
      ),
    },
    {
      title: <Typography>Tên giao khoán</Typography>,
      dataIndex: "assignmentCode",
      key: "name",
      render: (assignmentCode: any) => (
        <Typography>{assignmentCode?.name}</Typography>
      ),
    },
    {
      title: <Typography>ĐVT</Typography>,
      dataIndex: "assignmentCode",
      width: 50,
      key: "unit",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (assignmentCode: any) => {
        return <Typography>{assignmentCode?.uom?.name}</Typography>;
      },
    },
    {
      title: <Typography>Định mức gốc</Typography>,
      dataIndex: "baseNorm",
      key: "baseNorm",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (value: number) => (
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
    {
      title: <Typography>Hệ số điều chỉnh định mức</Typography>,
      dataIndex: "adjustmentNorm",
      key: "adjustmentNorm",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (value: number) => (
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
    {
      title: <Typography>Định mức</Typography>,
      dataIndex: "norm",
      key: "norm",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (value: number) => (
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
    // Thêm các cột còn lại dựa trên dữ liệu 'phase' cha
    {
      title: <Typography>Số lượng</Typography>,
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (value: number) => (
        // Số lượng cho định mức này là 1? Cần xem lại logic nghiệp vụ
        <Typography>{formatDecimal(value)}</Typography>
      ),
    },
    {
      title: <Typography>Đơn giá bình quân</Typography>,
      dataIndex: "price",
      key: "price",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (value: number) => (
        // Cột này cần dữ liệu từ đâu đó (có thể là data.unitPrice?)
        <Typography>{formattedPrice(value)}</Typography>
      ),
    },
    {
      title: <Typography>Chi phí kế hoạch</Typography>,
      dataIndex: "cost",
      key: "cost",
      align: "center" as const, // SỬA LỖI TS TỪ BƯỚC TRƯỚC
      render: (value: number) => (
        // Cột này cần dữ liệu từ đâu đó (có thể là data.unitPrice?)
        <Typography>{formattedPrice(value)}</Typography>
      ),
    },
  ];

  return (
    <Paper>
      <Table
        columns={innerColumns}
        dataSource={data?.budgetCostDetails || []} // <-- Dùng mảng đã xử lý
        pagination={false}
        size="small"
        rowKey="key"
        onRow={() => ({
          className: "custom-row2",
        })}
        onHeaderRow={() => ({
          className: "custom-header2",
        })}
      />
      <style>{`
        .custom-header2 > th {
          background-color: #cfcacafa !important;
        }
        .custom-row2 > td {
            background-color: #fdfafafa !important;
          }
      `}</style>
    </Paper>
  );
}
