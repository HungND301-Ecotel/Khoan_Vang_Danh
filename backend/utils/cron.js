const cron = require('node-cron')
const { updatePriceAssignmentCode } = require('./recalculateAssignmentCodePrice')
const AssignmentCode = require("../model/AssignmentCode");

cron.schedule('0 0 * * *', async () => {
    console.log('Cron bắt đầu chạy...')
    try {
        const AssignmentCodes = await AssignmentCode.find().select('_id')
        const assignmentIds = AssignmentCodes.map(i => i._id)
        await Promise.all(assignmentIds.map((id) => updatePriceAssignmentCode(id)));
        console.log('Cron chạy thành công ...')
    } catch (error) {
        console.log('Lỗi tính đơn giá giao khoán', error.message)
    }
})

