import { CalendarToday } from '@mui/icons-material';
import { Grid, MenuItem, TextField, Typography } from '@mui/material';
import React, { useState } from 'react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

export default function FieldMonthYear({ formik, selectedMonth, setSelectedMonth }: { formik?: any, selectedMonth?: string, setSelectedMonth?: React.Dispatch<React.SetStateAction<string>> }) {

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <DatePicker
                label="Chọn tháng"
                inputFormat="MM/YYYY" // v5 vẫn hỗ trợ
                views={['year', 'month']}
                openTo="month"
                value={(formik?.values.month || selectedMonth) ? dayjs(formik?.values.month || selectedMonth) : null}
                onChange={(value) => {
                    if (formik) {
                        formik.setFieldValue('month', value ? dayjs(value).format('YYYY-MM') : '');
                    }
                    if (setSelectedMonth) {
                        setSelectedMonth(value ? dayjs(value).format('YYYY-MM') : '');
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        fullWidth
                        size="small"
                        sx={{ backgroundColor: '#fff' }}
                    />
                )}
            />
        </LocalizationProvider>
    )
}
