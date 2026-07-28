const monthToNumber = (month) => {
  if (!month) return '';
  const monthStr = String(month);
  return Number(monthStr.replace('-', ''));
};

/**
 * Chuyển date string "dd/MM/yyyy" → YYYYMMDD number để so sánh
 * @param {string} dateStr - "01/02/2026"
 * @returns {number|null} - 20260201
 */
const dateToNumber = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const num = Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
  return isNaN(num) ? null : num;
};

/**
 * Format date number YYYYMMDD → "dd/MM/yyyy"
 * @param {number} dateNum - 20260201
 * @returns {string} - "01/02/2026"
 */
const numberToDate = (dateNum) => {
  if (!dateNum) return '';
  const str = String(dateNum);
  if (str.length !== 8) return '';
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  return `${day}/${month}/${year}`;
};

module.exports = {
    monthToNumber,
    dateToNumber,
    numberToDate
}