import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatDate(date: string | Date): string {
  const value = new Date(date)

  if (isToday(value)) {
    return format(value, "'Today at' h:mm a")
  }

  if (isYesterday(value)) {
    return format(value, "'Yesterday at' h:mm a")
  }

  return format(value, 'MMM d, yyyy')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy - h:mm a')
}
