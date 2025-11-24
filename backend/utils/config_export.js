

async function configExport(workbook, worksheet, validations = [], MAX) {

    worksheet.eachRow((row, rowNumber) => {
        row.eachCell(cell => {
            cell.font = { size: (rowNumber === 1) ? 9 : 8, bold: (rowNumber === 1) };
            cell.alignment = { vertical: 'middle', wrapText: (rowNumber === 1) };
        });
    });

    for (const v of validations) {
        worksheet.dataValidations.add(v.range, {
            type: 'list',
            allowBlank: true,
            formulae: [v.formula],
            showErrorMessage: true,
            errorTitle: 'Giá trị không hợp lệ',
            error: 'Giá trị bạn chọn không nằm trong danh sách cho phép!',
        });
    }

    // worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
    //     cell.protection = { locked: true };
    // });
    // for (let r = 1; r <= MAX; r++) {
    //     worksheet.getCell(`A${r}`).protection = { locked: true };
    // }

    // const editableCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    // for (let r = 2; r <= MAX; r++) {
    //     for (const col of editableCols) {
    //         worksheet.getCell(`${col}${r}`).protection = { locked: false };
    //     }
    // }

    // // 4) Khóa các cột ẩn (nguồn dropdown) X/Y/Z để tránh sửa danh mục
    // for (const col of ['X', 'Y', 'Z']) {
    //     for (let r = 1; r <= MAX; r++) {
    //         worksheet.getCell(`${col}${r}`).protection = { locked: true };
    //     }
    // }

    // // 3) Bật bảo vệ sheet
    // await worksheet.protect('ktv-protect', {
    //     selectLockedCells: true,
    //     selectUnlockedCells: true,
    //     formatCells: false,
    //     formatColumns: false,
    //     formatRows: false,
    //     insertRows: true,   // cho phép thêm dòng mới nếu cần
    //     deleteRows: false,
    //     insertColumns: false,
    //     deleteColumns: false,
    // });

    const buffer = await workbook.xlsx.writeBuffer();

    return buffer
}

module.exports = {
    configExport
} 