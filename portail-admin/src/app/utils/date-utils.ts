export function formatDateRange(
  startDate: Date | string | undefined,
  endDate: Date | string | undefined,
): string {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString('fr-FR', {
    month: 'short',
    day: '2-digit',
  });

  const endFormatted = end.toLocaleDateString('fr-FR', {
    month: 'short',
    day: '2-digit',
  });

  if (start.getFullYear() === end.getFullYear()) {
    return `${startFormatted} - ${endFormatted} ${end.getFullYear()}`;
  } else {
    return `${startFormatted} ${start.getFullYear()} - ${endFormatted} ${end.getFullYear()}`;
  }
}

export function formatDateRangeWithoutYear(
  startDate: Date | string | undefined,
  endDate: Date | string | undefined,
): string {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString('fr-FR', {
    month: 'short',
    day: '2-digit',
  });

  const endFormatted = end.toLocaleDateString('fr-FR', {
    month: 'short',
    day: '2-digit',
  });

  return `${startFormatted} - ${endFormatted}`;
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}
