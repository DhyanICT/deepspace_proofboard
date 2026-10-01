/**
 * Multi-user collaboration spec — verifies two users sign in into
 * separate browser contexts and the app distinguishes them.
 *
 * `users(2)` takes any two accounts from your pool, so this spec passes on a
 * fresh app with no setup beyond having two test accounts:
 *   npx deepspace test accounts list
 *   npx deepspace test accounts create --email a@deepspace.test --name "A" --password-stdin
 *
 * Ask for accounts *by name* (`users(['Alice', 'Bob'])`) only when the
 * behaviour under test depends on which identity acts — otherwise naming them
 * couples the spec to one machine's pool.
 *
 * The `users` fixture handles sign-in caching (per-account storageState
 * persisted to `~/.deepspace/playwright-states/`), context creation, and
 * cleanup. No need to manage browser contexts manually.
 */
import { test, expect, loadAllTestAccounts } from 'deepspace/testing'

// A machine that has never created test accounts is the normal state of a
// fresh checkout, and there `users()` throws — turning "you have no pool yet"
// into three red tests about the app, which it is not. Skip the file instead
// and say what creates the pool. The count is of accounts usable HERE: the
// pool is global per developer, but passwords live only on the machine that
// created the account.
const usableTestAccounts = loadAllTestAccounts().length
test.skip(
  usableTestAccounts < 2,
  `Needs 2 usable test accounts, found ${usableTestAccounts}. Create them with ` +
    '`npx deepspace test accounts create --email <name>@deepspace.test --name "<name>" ' +
    '--password-stdin`, or fetch existing pool accounts with `npx deepspace test accounts recover --all`.',
)

test('each browser renders its own signed-in account', async ({ users }) => {
  const [a, b] = await users(2)

  // /home is dynamic (under src/pages/(app)/), so it mounts the nav shell;
  // '/' is the static landing and has no navigation.
  await Promise.all([a.page.goto('/home'), b.page.goto('/home')])

  // Email, not name. The page renders the *session's* `name || email`, while
  // `user.name` here comes from the LOCAL account registry — and the two are
  // not the same fact: a display name is optional, and an account recovered on
  // another machine has none stored locally at all. The email is the credential
  // the context signed in with, so it is the one identity both sides agree on,
  // and asserting it proves the page is showing THIS browser's account.
  // The two accounts are distinct, so two exact matches is also the proof that
  // the contexts are not sharing one session.
  for (const user of [a, b]) {
    await expect(user.page.getByTestId('app-navigation')).toBeVisible({ timeout: 15_000 })

    // The identity chip shows `name || email`. Its text is not predictable, but
    // its presence is: something must be there once the profile has loaded.
    // (It is `hidden sm:inline` in some templates, so assert text, not
    // visibility.)
    await expect(user.page.getByTestId('nav-user-name')).toHaveText(/\S/, { timeout: 15_000 })

    await user.page.getByRole('button', { name: 'Account menu' }).click()
    await expect(user.page.getByTestId('nav-user-email')).toHaveText(user.email, {
      timeout: 15_000,
    })
  }
})

test('API status page renders loading success and error states', async ({ users }) => {
  const [user] = await users(1)
  let shouldFail = false
  let requestCount = 0

  await user.page.route('**/api/integrations', async (route) => {
    requestCount += 1
    if (shouldFail) {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Catalog unavailable' }),
      })
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { integrations: { openai: {}, wikipedia: {} } },
      }),
    })
  })

  await user.page.goto('/api-status')
  await expect(user.page.getByText('Loading integration catalog...')).toBeVisible()
  await expect(user.page.getByText('Integration catalog ready')).toBeVisible()
  await expect(user.page.getByText('2 integrations available.')).toBeVisible()

  shouldFail = true
  await user.page.getByRole('button', { name: 'Refresh' }).click()
  await expect(user.page.getByText('Catalog unavailable')).toBeVisible()
  await expect(user.page.getByText('Showing the last loaded catalog')).toBeVisible()
  await expect(user.page.getByText('Integration catalog ready')).toBeVisible()

  const urlAfterFailure = user.page.url()
  const requestsAfterFailure = requestCount
  await user.page.getByRole('button', { name: 'Refresh' }).click()
  await expect.poll(() => requestCount).toBeGreaterThan(requestsAfterFailure)
  expect(user.page.url()).toBe(urlAfterFailure)
})

test('API status page shows local retry after first-load API failure', async ({ users }) => {
  const [user] = await users(1)
  let requestCount = 0

  await user.page.route('**/api/integrations', async (route) => {
    requestCount += 1
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'Catalog unavailable' }),
    })
  })

  await user.page.goto('/api-status')
  await expect(user.page.getByText('Loading integration catalog...')).toBeVisible()
  await expect(user.page.getByText('Could not load API data')).toBeVisible()
  await expect(user.page.getByText('Retried 1 time automatically.')).toBeVisible()

  const retryButton = user.page.getByRole('button', { name: 'Retry' })
  await expect(retryButton).toBeVisible()

  const urlAfterFailure = user.page.url()
  const requestsAfterFailure = requestCount
  await retryButton.click()
  await expect.poll(() => requestCount).toBeGreaterThan(requestsAfterFailure)
  expect(user.page.url()).toBe(urlAfterFailure)
})

test('two people build a decision and see each other’s changes', async ({ users }) => {
  test.setTimeout(90_000)
  const [a, b] = await users(2)
  const marker = `__test-${Date.now()}__`
  const boardTitle = `${marker} Team day`
  const firstOption = `${marker} Studio day`
  const secondOption = `${marker} Short offsite`
  const reason = `${marker} Less travel time gives us more time together.`
  const outcome = `${marker} We chose a short offsite because the group preferred a change of scene.`

  await Promise.all([a.page.goto('/home'), b.page.goto('/home')])
  await a.page.getByRole('button', { name: 'New decision' }).click()
  const newBoard = a.page.getByRole('dialog', { name: 'Start a decision' })
  await newBoard.getByLabel('Short title').fill(boardTitle)
  await newBoard.getByLabel('Decision question').fill('Where should we spend our next team day?')
  await newBoard.getByRole('button', { name: 'Create board' }).click()
  await expect(a.page).toHaveURL(/\/boards\//)
  const boardUrl = a.page.url()

  await b.page.goto(boardUrl)
  await expect(b.page.getByRole('heading', { name: boardTitle })).toBeVisible()
  await expect(a.page.getByText('2 people here')).toBeVisible({ timeout: 15_000 })

  async function addOption(page: typeof a.page, title: string) {
    await page.getByRole('button', { name: 'Add option' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Add an option' })
    await dialog.getByLabel('Option name').fill(title)
    await dialog.getByRole('button', { name: 'Add option' }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }

  await addOption(a.page, firstOption)
  await expect(b.page.getByRole('heading', { name: firstOption })).toBeVisible()
  await addOption(a.page, secondOption)
  await expect(b.page.getByRole('heading', { name: secondOption })).toBeVisible()

  const firstOnA = a.page.locator('article').filter({ hasText: firstOption })
  await firstOnA.getByRole('button', { name: 'Add reason' }).click()
  const reasonDialog = a.page.getByRole('dialog', { name: 'Add a reason' })
  await reasonDialog.getByLabel('Your reason').fill(reason)
  await reasonDialog.getByRole('button', { name: 'Add reason' }).click()
  await expect(b.page.getByText(reason)).toBeVisible()

  await firstOnA.getByRole('button', { name: 'Vote for this' }).click()
  const secondOnB = b.page.locator('article').filter({ hasText: secondOption })
  await secondOnB.getByRole('button', { name: 'Vote for this' }).click()
  await expect(a.page.getByText('2 people have voted.')).toBeVisible()
  await a.page
    .locator('article')
    .filter({ hasText: secondOption })
    .getByRole('button', { name: 'Change vote' })
    .click()
  await expect(secondOnB.getByText('2 votes')).toBeVisible()
  await expect(b.page.getByText('2 people have voted.')).toBeVisible()

  await a.page.getByRole('button', { name: 'Record outcome' }).click()
  const outcomeDialog = a.page.getByRole('dialog', { name: 'Record outcome' })
  await outcomeDialog.getByLabel('Decision and reasoning').fill(outcome)
  await outcomeDialog.getByRole('button', { name: 'Save outcome' }).click()
  await expect(b.page.getByText(outcome)).toBeVisible()
  await expect(b.page.getByText('Outcome recorded')).toBeVisible()

  // Optional visual QA artifact. The regular test run does not write screenshots.
  const captureDir = process.env.PROOFBOARD_CAPTURE_DIR
  if (captureDir) {
    await a.page.waitForTimeout(6_000) // let success toasts and dialog exit animations settle
    await a.page.setViewportSize({ width: 1440, height: 900 })
    await a.page.screenshot({ path: `${captureDir}/board-desktop.png` })
    await a.page.setViewportSize({ width: 390, height: 844 })
    await a.page.screenshot({ path: `${captureDir}/board-mobile.png` })
    await a.page.locator('main').evaluate((element) => { element.scrollTop = 730 })
    await a.page.screenshot({ path: `${captureDir}/board-mobile-scrolled.png` })
  }
})
