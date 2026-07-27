/**
 * Chuyển "YYYY-MM" thành số để so sánh (202403)
 */
const monthToNumber = (monthStr) => {
  if (!monthStr) return 0;
  const [year, month] = monthStr.split('-');
  return parseInt(year) * 100 + parseInt(month);
};

/**
 * Chuyển số thành "YYYY-MM"
 */
const numberToMonth = (num) => {
  const year = Math.floor(num / 100);
  const month = num % 100;
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Trim và clean string
 */
const cleanString = (str) => {
  if (!str) return '';
  return String(str).trim();
};

/**
 * Parse ID từ string
 */
const parseId = (id) => {
  if (!id) return null;
  return String(id).replace(/"/g, '').trim();
};

module.exports = {
  monthToNumber,
  numberToMonth,
  cleanString,
  parseId,
};
