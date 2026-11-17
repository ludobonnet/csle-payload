import React from 'react'

/** « Articles 1 à 12 sur 301 » ; « Aucun résultat » quand la liste est vide. */
export const PageRange: React.FC<{
  className?: string
  currentPage?: number
  limit?: number
  totalDocs?: number
}> = ({ className, currentPage = 1, limit = 1, totalDocs }) => {
  if (typeof totalDocs === 'undefined') return null

  const start = Math.min((currentPage - 1) * limit + 1, totalDocs)
  const end = Math.min(currentPage * limit, totalDocs)

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {totalDocs === 0
        ? 'Aucun résultat.'
        : totalDocs === 1
          ? '1 article'
          : `Articles ${start} à ${end} sur ${totalDocs.toLocaleString('fr-FR')}`}
    </div>
  )
}
