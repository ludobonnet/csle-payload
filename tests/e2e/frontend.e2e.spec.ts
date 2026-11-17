import { expect, test } from '@playwright/test'

/**
 * Parcours publics essentiels, sur la base de dev migrée depuis WordPress.
 * Lancer : pnpm test:e2e (démarre `pnpm dev` si besoin).
 */
test.describe('Site public', () => {
  test('accueil : titre du site, logo, derniers articles', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('CSLE - Magazine voyage tourisme culture et lifestyle')
    await expect(page.locator('header').getByText('CSLE', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Articles récents' })).toBeVisible()
  })

  test('article : images du corps et vidéo intégrée', async ({ page }) => {
    await page.goto('/pop-up-store-meurice-valmont')
    await expect(page).toHaveTitle(/ - CSLE$/)
    // image principale + au moins une image dans le corps
    expect(await page.locator('article img, main img').count()).toBeGreaterThan(1)

    await page.goto('/une-cartouche-sur-la-scene')
    await expect(page.locator('iframe[src*="youtube-nocookie.com/embed"], iframe[src*="dailymotion"], iframe[src*="vimeo"]').first()).toBeAttached()
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
