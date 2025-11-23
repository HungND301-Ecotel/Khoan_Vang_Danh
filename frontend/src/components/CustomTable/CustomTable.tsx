import { Typography } from "@mui/material";
import { Table, TableProps } from "antd";
import React from "react";
import EmptyState from "../../ui/EmptyState";

interface CustomTableProps<T extends { _id?: string }> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    columns: TableProps<T>["columns"];
    rowSelection?: TableProps<T>["rowSelection"];
    onPageChange: (page: number, pageSize: number) => void;
    isLoading: boolean,
    searchValue: string,
    handleClearSearch: () => void;
    expandable?: TableProps<T>["expandable"]
}

export default function CustomTable<T extends { _id?: string }>(
    props: CustomTableProps<T>
) {
    const { data, total, page, limit, columns, rowSelection, onPageChange, isLoading, searchValue, handleClearSearch, expandable } = props;

    return (
        <Table<T>
            rowKey="_id"
            rowSelection={rowSelection}
            expandable={expandable}
            pagination={{
                current: page,
                pageSize: limit,
                total,
                onChange: onPageChange,
                position: ["bottomCenter"],
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                defaultPageSize: 10,
                showTotal: (total, range) => (
                    <div style={{ flex: 1, textAlign: "left" }}>
                        {isLoading && searchValue ? (
                            <Typography variant="body2" color="primary">
                                Đang lọc...
                            </Typography>
                        ) : (
                            `Hiển thị ${range[0]}-${range[1]} trên ${total} mục`
                        )}
                    </div>
                ),
            }}
            columns={columns}
            dataSource={data}
            loading={isLoading}
            locale={{
                emptyText: <EmptyState searchValue={searchValue} handleClearSearch={handleClearSearch} />
            }}
        />
    );
}
