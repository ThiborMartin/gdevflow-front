export function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export function formatPeriod(startDate?: string, endDate?: string) {
  return `${formatDate(startDate)} a ${formatDate(endDate)}`;
}
