const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

/** Date de publication en toutes lettres : « 27 octobre 2021 ». */
export const formatDateTime = (timestamp: string): string =>
  dateFormat.format(timestamp ? new Date(timestamp) : new Date())
