import { expect, test } from '@playwright/test'

/**
 * Parcours publics essentiels, sur la base de dev migrée depuis WordPress.
 * Lancer : pnpm test:e2e (démarre `pnpm dev` si besoin).
 */
test.describe('Site public', () => {
  test('accueil : titre du site, logo, à la une, sections par rubrique', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('CSLE - Magazine voyage tourisme culture et lifestyle')
    await expect(
      page.locator('header').getByRole('link', { name: /retour à l'accueil/ }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'À la une' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Culture', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Toutes les rubriques' })).toBeVisible()
  })

  test('rubrique paginée à la manière de WordPress', async ({ page, request }) => {
    const response = await page.goto('/culture/page/2')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle('Culture, page 2 - CSLE')
    await expect(page.locator('nav[aria-label="Pages"] [aria-current="page"]')).toHaveText('2')

    const first = await request.get('/culture/page/1', { maxRedirects: 0 })
    expect(first.status()).toBe(308)
    expect(first.headers().location).toBe('/culture')

    expect((await request.get('/culture/page/9999')).status()).toBe(404)
  })

  test('recherche : la requête de l’URL est conservée', async ({ page }) => {
    await page.goto('/search?q=jeep')
    await expect(page.getByRole('searchbox')).toHaveValue('jeep')
    await page.waitForTimeout(800)
    expect(new URL(page.url()).searchParams.get('q')).toBe('jeep')
    await expect(page.locator('main article').first()).toBeVisible()
  })

  test('recherche plein texte, sans tenir compte des accents', async ({ page }) => {
    // « gael » trouve « Gaël Faye », présent dans le texte et le titre
    await page.goto('/search?q=gael%20faye')
    await expect(page.getByRole('link', { name: /Châteaurenard/ })).toBeVisible()
    // « lisbonne » n'apparaît que dans le texte d'un article, pas dans son titre
    await page.goto('/search?q=lisbonne')
    await expect(page.locator('main article').first()).toBeVisible()
  })

  test('mots-clés : pages /tag/… navigables mais hors index', async ({ page, request }) => {
    const response = await page.goto('/tag/musique')
    expect(response?.status()).toBe(200)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    expect((await request.get('/tag/mot-cle-inexistant')).status()).toBe(404)
  })

  test('bio de l’autrice en fin d’article', async ({ page }) => {
    await page.goto('/faire-un-safari-en-afrique-du-sud')
    await expect(page.getByRole('complementary', { name: 'À propos de Sandrine' })).toBeVisible()
  })

  test('menu mobile : sommaire des rubriques', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#menu-mobile').getByRole('link', { name: /^Culture/ })).toBeVisible()
  })

  test('article : images du corps et vidéo intégrée', async ({ page }) => {
    await page.goto('/pop-up-store-meurice-valmont')
    await expect(page).toHaveTitle(/ - CSLE$/)
    // image principale + au moins une image dans le corps
    expect(await page.locator('article img, main img').count()).toBeGreaterThan(1)

    await page.goto('/une-cartouche-sur-la-scene')
    await expect(
      page
        .locator(
          'iframe[src*="youtube-nocookie.com/embed"], iframe[src*="dailymotion"], iframe[src*="vimeo"]',
        )
        .first(),
    ).toBeAttached()
  })

  test('catégorie servie à la racine', async ({ page }) => {
    const response = await page.goto('/culture')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle('Culture - CSLE')
  })

  test('404 en français, y compris sur plusieurs segments', async ({ page }) => {
    for (const url of ['/cette-page-n-existe-pas', '/a/b/c']) {
      const response = await page.goto(url)
      expect(response?.status()).toBe(404)
      await expect(page.getByText('Cette page s’est perdue en chemin')).toBeVisible()
    }
  })

  test('redirections permanentes', async ({ request }) => {
    const legacy = await request.get('/posts/pop-up-store-meurice-valmont', { maxRedirects: 0 })
    expect(legacy.status()).toBe(308)
    expect(legacy.headers().location).toBe('/pop-up-store-meurice-valmont')

    const emptyPost = await request.get('/le-king-du-bling-bling', { maxRedirects: 0 })
    expect(emptyPost.headers().location).toBe('/humour')
  })

  test('la route de seed du template n’existe plus', async ({ request }) => {
    expect((await request.post('/next/seed', { maxRedirects: 0 })).status()).not.toBe(200)
  })
})

test.describe('Pages légales et contact', () => {
  for (const [url, title] of [
    ['/mentions-legales', 'Mentions légales - CSLE'],
    ['/confidentialite', 'Confidentialité - CSLE'],
    ['/contact', 'Contact - CSLE'],
  ]) {
    test(`${url} existe et est liée depuis le pied de page`, async ({ page }) => {
      const response = await page.goto(url)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(title)
      await expect(page.locator(`footer a[href="${url}"]`)).toBeVisible()
    })
  }

  test('mentions légales : éditeur et hébergeur', async ({ page }) => {
    await page.goto('/mentions-legales')
    await expect(page.getByText('Ludovic Bonnet', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('PulseHeberg', { exact: false })).toBeVisible()
  })

  test('anciennes pages WordPress redirigées', async ({ request }) => {
    const cgu = await request.get('/cgu', { maxRedirects: 0 })
    expect(cgu.headers().location).toBe('/mentions-legales')
  })

  test('vidéos YouTube sans cookie', async ({ page }) => {
    await page.goto('/une-cartouche-sur-la-scene')
    expect(await page.locator('iframe[src*="www.youtube.com/embed"]').count()).toBe(0)
  })
})
