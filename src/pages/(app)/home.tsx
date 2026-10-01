/* home pattern: data-forward — the live decision board list is the primary surface */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useMutations, useQuery } from 'deepspace'
import { ArrowRight, ArrowUpRight, ClipboardList, Plus } from 'lucide-react'
import { Button, EmptyState, Input, Label, Modal, Textarea, useToast } from '../../components/ui'
import type { Board } from '../../proofboard-types'

const sampleBoard = {
  title: 'How should we spend our next team day?',
  question: 'Find a day that helps us connect without losing a week of momentum.',
}

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const {
    records: boards,
    status,
    error: boardsError,
  } = useQuery<Board>('boards', { orderBy: 'createdAt', orderDir: 'desc' })
  const { ready: boardReady, createConfirmed } = useMutations<Board>('boards')
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')
  const [validation, setValidation] = useState('')
  const [creating, setCreating] = useState(false)

  async function createBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!boardReady) return
    if (!title.trim() || !question.trim()) {
      setValidation('Add a short title and the question your group needs to answer.')
      return
    }
    setValidation('')
    setCreating(true)
    try {
      const id = await createConfirmed({
        title: title.trim(),
        question: question.trim(),
        context: context.trim(),
        status: 'open',
        decision: '',
      })
      success('Decision started', 'Your board is ready for options.')
      setShowNew(false)
      setTitle('')
      setQuestion('')
      setContext('')
      navigate(`/boards/${id}`)
    } catch (cause) {
      error('Could not create board', cause instanceof Error ? cause.message : 'Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-full bg-background px-5 pb-20 pt-10 sm:px-8 lg:pt-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              The decision desk
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Open questions
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              A shared place to compare the options, hear the reasons, and record the call.
            </p>
          </div>
          {isSignedIn && (
            <Button className="self-start" disabled={!boardReady} onClick={() => setShowNew(true)}>
              <Plus className="size-4" aria-hidden /> New decision
            </Button>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {isSignedIn
              ? `${boards.length} decision${boards.length === 1 ? '' : 's'}`
              : 'A look inside'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isSignedIn
              ? 'Changes appear for everyone in real time.'
              : 'Sign in from the top right to start a decision.'}
          </p>
        </div>

        {!isSignedIn ? (
          <div className="mt-5 grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <div className="rounded-lg border border-border bg-card p-7 shadow-[0_8px_30px_-24px_rgba(24,57,57,0.4)]">
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                Example board
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                {sampleBoard.title}
              </h2>
              <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
                {sampleBoard.question}
              </p>
              <div className="mt-7 flex gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
                <span>3 options</span>
                <span>·</span>
                <span>4 evidence notes</span>
                <span>·</span>
                <span>7 votes</span>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-lg border border-border bg-secondary/55 p-7">
              <ClipboardList className="size-7 text-primary" aria-hidden />
              <div>
                <h2 className="mt-8 text-xl font-semibold tracking-[-0.04em]">
                  Make the reasoning visible.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Every option gets space for evidence and a vote. The final decision stays with the
                  conversation.
                </p>
              </div>
            </div>
          </div>
        ) : status === 'loading' ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : status === 'error' ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-destructive/40 bg-card p-5 text-sm text-destructive"
          >
            Could not load boards. {boardsError ?? 'Reload and try again.'}
          </p>
        ) : boards.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-card p-6">
            <EmptyState
              icon={<ClipboardList />}
              title="No decisions yet"
              description="Start with one question your group needs to answer."
              action={{ label: 'New decision', onClick: () => setShowNew(true) }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {boards.map((board) => (
              <Link
                key={board.recordId}
                to={`/boards/${board.recordId}`}
                className="group flex min-h-56 flex-col rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_32px_-24px_rgba(24,57,57,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${board.data.status === 'decided' ? 'bg-muted text-muted-foreground' : 'bg-secondary text-primary'}`}
                  >
                    {board.data.status === 'decided' ? 'Decided' : 'Open for input'}
                  </span>
                  <ArrowUpRight
                    className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
                <h2 className="mt-5 line-clamp-2 text-xl font-semibold tracking-[-0.04em]">
                  {board.data.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {board.data.question}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-xs font-semibold text-primary">
                  Open board <ArrowRight className="size-3" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} size="md">
        <Modal.Header>
          <Modal.Title>Start a decision</Modal.Title>
          <Modal.Description>Ask the question your group needs to settle.</Modal.Description>
        </Modal.Header>
        <form onSubmit={createBoard}>
          <Modal.Body className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="board-title">Short title</Label>
              <Input
                id="board-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={90}
                placeholder="e.g. Our next team day"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-question">Decision question</Label>
              <Input
                id="board-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={180}
                placeholder="What do we need to choose?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-context">
                Context <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="board-context"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                maxLength={600}
                placeholder="What should everyone know before weighing in?"
                rows={4}
              />
            </div>
            {validation && (
              <p role="alert" className="text-sm text-destructive">
                {validation}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating} disabled={!boardReady}>
              Create board
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}
