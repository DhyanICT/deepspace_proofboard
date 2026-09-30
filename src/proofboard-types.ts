export interface Board {
  title: string
  question: string
  context: string
  status: 'open' | 'decided'
  decision: string
}

export interface Option {
  boardId: string
  title: string
  detail: string
}

export interface Evidence {
  boardId: string
  optionId: string
  stance: 'for' | 'against'
  note: string
  sourceUrl: string
}

export interface Vote {
  boardId: string
  optionId: string
  userId: string
}
