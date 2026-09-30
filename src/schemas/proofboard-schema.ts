import type { CollectionSchema } from 'deepspace/schema'

// Every signed-in member can see the shared decision space. The owner controls
// the board; contributors control their own options and evidence. Anonymous
// visitors cannot read or write any board data.
export const boardsSchema: CollectionSchema = {
  name: 'boards',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain', required: true },
    { name: 'question', storage: 'text', interpretation: 'plain', required: true },
    { name: 'context', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: { kind: 'select', options: ['open', 'decided'] }, required: true },
    { name: 'decision', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const optionsSchema: CollectionSchema = {
  name: 'options',
  columns: [
    { name: 'boardId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'title', storage: 'text', interpretation: 'plain', required: true },
    { name: 'detail', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const evidenceSchema: CollectionSchema = {
  name: 'evidence',
  columns: [
    { name: 'boardId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'optionId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'stance', storage: 'text', interpretation: { kind: 'select', options: ['for', 'against'] }, required: true },
    { name: 'note', storage: 'text', interpretation: 'plain', required: true },
    { name: 'sourceUrl', storage: 'text', interpretation: { kind: 'url' } },
  ],
  permissions: {
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

// The Durable Object enforces one vote per person per board. userBound stops a
// client from voting under another user's identity; the vote remains editable.
export const votesSchema: CollectionSchema = {
  name: 'votes',
  columns: [
    { name: 'boardId', storage: 'text', interpretation: 'plain', required: true, immutable: true },
    { name: 'optionId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'userId', storage: 'text', interpretation: 'plain', required: true, immutable: true, userBound: true },
  ],
  uniqueOn: ['boardId', 'userId'],
  ownerField: 'userId',
  permissions: {
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
