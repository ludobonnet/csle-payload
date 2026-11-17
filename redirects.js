/**
 * Redirections permanentes versionnées avec le code.
 * Les redirections éditoriales ponctuelles passent par la collection `redirects` de l'admin.
 */
const redirects = async () => [
  // Anciennes URLs /posts/:slug du template → URL canonique /:slug
  { source: '/posts/:slug', destination: '/:slug', permanent: true },

  // Anciennes pages WordPress : CGU de casentlete.fr remplacées, liens d'échange abandonnés
  { source: '/cgu', destination: '/mentions-legales', permanent: true },
  { source: '/partenaires', destination: '/', permanent: true },

  // Articles WordPress vides (vidéos Flash de 2008), non migrés : vers leur catégorie
  { source: '/jamel-comedy-club-thomas-ngijol-et-blanche-une-super-chanson-damour', destination: '/humour', permanent: true },
  { source: '/le-king-du-bling-bling', destination: '/humour', permanent: true },
]

export default redirects
