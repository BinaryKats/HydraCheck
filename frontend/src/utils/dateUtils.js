/**
 * Date and Time Formatting Utilities
 * Standardizes timestamp display to Indian Standard Time (IST)
 * Format: DD/MM/YYYY, HH:mm:ss IST (24-hour format)
 */

export function formatIST(dateInput) {
  if (!dateInput) return 'N/A'

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'N/A'

  // Format options for IST
  const options = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }

  const formatter = new Intl.DateTimeFormat('en-GB', options)
  const parts = formatter.formatToParts(date)

  const day = parts.find(p => p.type === 'day')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const year = parts.find(p => p.type === 'year')?.value
  const hour = parts.find(p => p.type === 'hour')?.value
  const minute = parts.find(p => p.type === 'minute')?.value
  const second = parts.find(p => p.type === 'second')?.value

  return `${day}/${month}/${year}, ${hour}:${minute}:${second} IST`
}

export function formatISTShort(dateInput) {
  if (!dateInput) return 'N/A'

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'N/A'

  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }

  return new Intl.DateTimeFormat('en-GB', options).format(date) + ' IST'
}
