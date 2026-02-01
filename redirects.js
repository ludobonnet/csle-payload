const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // SEO redirect: old /posts/:slug URLs to new /:slug URLs
  const postsRedirect = {
    source: '/posts/:slug',
    destination: '/:slug',
    permanent: true,
  }

  const redirects = [internetExplorerRedirect, postsRedirect]

  return redirects
}

export default redirects
