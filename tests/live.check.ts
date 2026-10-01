import { test, expect, loadAllTestAccounts } from 'deepspace/testing'

const demoTitle = 'Live demo: choosing a team day'
const studio = 'A quiet studio day'
const offsite = 'A short offsite'
const reason = 'An offsite makes it easier to step away from the usual work rhythm.'
const outcome = 'The group chose a short offsite after comparing the reasons and votes.'

test.skip(loadAllTestAccounts().length < 2, 'Create two DeepSpace test accounts before running the live check.')

test('two signed-in people complete the deployed decision flow', async ({ users }) => {
  const [a, b] = await users(2)
  await Promise.all([a.page.goto('/home'), b.page.goto('/home')])
  await expect(a.page.getByRole('heading', { name: 'Open questions' })).toBeVisible()
  await expect(b.page.getByRole('heading', { name: 'Open questions' })).toBeVisible()

  const existingDemo = a.page.locator('a[href^="/boards/"]').filter({ hasText: demoTitle }).first()
  if (await existingDemo.count()) {
    await existingDemo.click()
    await expect(a.page.getByRole('heading', { name: demoTitle })).toBeVisible()
    await expect(a.page.getByText(outcome)).toBeVisible()
    console.log(`PROOFBOARD_DEMO_URL=${a.page.url()}`)
    return
  }

  await a.page.getByRole('button', { name: 'New decision' }).click()
  const newBoard = a.page.getByRole('dialog', { name: 'Start a decision' })
  await newBoard.getByLabel('Short title').fill(demoTitle)
  await newBoard.getByLabel('Decision question').fill('How should our team spend a day together?')
  await newBoard.getByLabel('Context').fill('A sample board for exploring Proofboard’s shared decision flow.')
  await newBoard.getByRole('button', { name: 'Create board' }).click()
  await expect(a.page).toHaveURL(/\/boards\//)
  const boardUrl = a.page.url()
  console.log(`PROOFBOARD_DEMO_URL=${boardUrl}`)

  await b.page.goto(boardUrl)
  await expect(b.page.getByRole('heading', { name: demoTitle })).toBeVisible()
  await expect(a.page.getByText('2 people here')).toBeVisible()

  for (const title of [studio, offsite]) {
    await a.page.getByRole('button', { name: 'Add option' }).first().click()
    const dialog = a.page.getByRole('dialog', { name: 'Add an option' })
    await dialog.getByLabel('Option name').fill(title)
    await dialog.getByRole('button', { name: 'Add option' }).click()
    await expect(b.page.getByRole('heading', { name: title })).toBeVisible()
  }

  const offsiteOnA = a.page.locator('article').filter({ hasText: offsite })
  await offsiteOnA.getByRole('button', { name: 'Add reason' }).click()
  const reasonDialog = a.page.getByRole('dialog', { name: 'Add a reason' })
  await reasonDialog.getByLabel('Your reason').fill(reason)
  await reasonDialog.getByRole('button', { name: 'Add reason' }).click()
  await expect(b.page.getByText(reason)).toBeVisible()

  await a.page.locator('article').filter({ hasText: studio }).getByRole('button', { name: 'Vote for this' }).click()
  await b.page.locator('article').filter({ hasText: offsite }).getByRole('button', { name: 'Vote for this' }).click()
  await a.page.locator('article').filter({ hasText: offsite }).getByRole('button', { name: 'Change vote' }).click()
  await expect(b.page.locator('article').filter({ hasText: offsite }).getByText('2 votes')).toBeVisible()

  await a.page.getByRole('button', { name: 'Record outcome' }).click()
  const outcomeDialog = a.page.getByRole('dialog', { name: 'Record outcome' })
  await outcomeDialog.getByLabel('Decision and reasoning').fill(outcome)
  await outcomeDialog.getByRole('button', { name: 'Save outcome' }).click()
  await expect(b.page.getByText(outcome)).toBeVisible()
  await expect(b.page.getByText('Outcome recorded')).toBeVisible()
})
