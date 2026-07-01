export const formattedPrice = (price?: number | null) => {
  if (!price) return "";

  return new Intl.NumberFormat("de-DE").format(Math.round(price));
};

export const formatDecimal = (decimal?: number) => {
  if (decimal === undefined || decimal === null) return "";
  return new Intl.NumberFormat("en-de", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(decimal);
};
