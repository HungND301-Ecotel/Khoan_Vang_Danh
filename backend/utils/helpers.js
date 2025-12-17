const monthToNumber = (month) => month ? Number(month.replace('-', '')) : ''


module.exports = {
    monthToNumber
}