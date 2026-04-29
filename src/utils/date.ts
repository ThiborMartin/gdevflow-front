const apiDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toApiDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseApiDate(value?: string) {
  if (!value) {
    return null;
  }

  const matches = value.match(apiDatePattern);

  if (matches) {
    const [, year, month, day] = matches;
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function getDatePickerValue(value?: string) {
  return parseApiDate(value) || new Date();
}

export function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = parseApiDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export function formatPeriod(startDate?: string, endDate?: string) {
  return `${formatDate(startDate)} a ${formatDate(endDate)}`;
}
