import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth, useMutations, usePresenceRoom, useQuery } from 'deepspace'
import { ArrowLeft, ArrowUpRight, Check, ClipboardCopy, Layers3, Plus, Users } from 'lucide-react'
import {
  Button,
  EmptyState,
  Input,
  Label,
  Modal,
  Textarea,
  useToast,
} from '../../../../components/ui'
import type { Board, Evidence, Option, Vote } from '../../../../proofboard-types'

type EvidenceStance = Evidence['stance']

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export default function BoardPage() {
  const { boardId = '' } = useParams<{ boardId: string }>()
  const { userId } = useAuth()
  const { peers, connected } = usePresenceRoom(`proofboard:${boardId}`)
  const { records: boards, status: boardStatus, error: boardError } = useQuery<Board>('boards')
  const {
    records: options,
    status: optionStatus,
    error: optionError,
  } = useQuery<Option>('options', {
    where: { boardId },
    orderBy: 'createdAt',
  })
  const {
    records: evidence,
    status: evidenceStatus,
    error: evidenceError,
  } = useQuery<Evidence>('evidence', {
    where: { boardId },
    orderBy: 'createdAt',
  })
  const {
    records: votes,
    status: voteStatus,
    error: voteError,
  } = useQuery<Vote>('votes', {
    where: { boardId },
  })
  const { ready: optionReady, createConfirmed: createOption } = useMutations<Option>('options')
  const { ready: evidenceReady, createConfirmed: createEvidence } =
    useMutations<Evidence>('evidence')
  const {
    ready: voteReady,
    createConfirmed: createVote,
    putConfirmed: updateVote,
  } = useMutations<Vote>('votes')
  const { ready: boardReady, putConfirmed: updateBoard } = useMutations<Board>('boards')
  const { success, error } = useToast()

  const [showOption, setShowOption] = useState(false)
  const [optionTitle, setOptionTitle] = useState('')
  const [optionDetail, setOptionDetail] = useState('')
  const [optionValidation, setOptionValidation] = useState('')
  const [optionPending, setOptionPending] = useState(false)

  const [reasonOptionId, setReasonOptionId] = useState<string | null>(null)
  const [stance, setStance] = useState<EvidenceStance>('for')
  const [note, setNote] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [reasonValidation, setReasonValidation] = useState('')
  const [reasonPending, setReasonPending] = useState(false)

  const [votePending, setVotePending] = useState<string | null>(null)
  const [showOutcome, setShowOutcome] = useState(false)
  const [outcome, setOutcome] = useState('')
  const [outcomeValidation, setOutcomeValidation] = useState('')
  const [outcomePending, setOutcomePending] = useState(false)

  const board = boards.find((item) => item.recordId === boardId)
  const myVote = votes.find((item) => item.data.userId === userId)
  const optionIds = new Set(options.map((item) => item.recordId))
  const validVotes = votes.filter((item) => optionIds.has(item.data.optionId))
  const totalVotes = validVotes.length
  const canRecordOutcome = !!board && board.createdBy === userId
  const reasonOption = options.find((item) => item.recordId === reasonOptionId)

  async function addOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!optionTitle.trim()) {
      setOptionValidation('Give this option a name.')
      return
    }
    setOptionValidation('')
    setOptionPending(true)
    try {
      await createOption({ boardId, title: optionTitle.trim(), detail: optionDetail.trim() })
      success('Option added', 'Everyone on this board can see it now.')
      setShowOption(false)
      setOptionTitle('')
      setOptionDetail('')
    } catch (cause) {
      error('Could not add option', cause instanceof Error ? cause.message : 'Please try again.')
    } finally {
      setOptionPending(false)
    }
  }

  async function addReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reasonOptionId || !optionIds.has(reasonOptionId)) return
    if (!note.trim()) {
      setReasonValidation('Write a short reason before adding it.')
      return
    }
    const safeUrl = sourceUrl.trim() ? httpUrl(sourceUrl.trim()) : ''
    if (safeUrl === null) {
      setReasonValidation('Use a full http or https URL, or leave the source blank.')
      return
    }
    setReasonValidation('')
    setReasonPending(true)
    try {
      await createEvidence({
        boardId,
        optionId: reasonOptionId,
        stance,
        note: note.trim(),
        sourceUrl: safeUrl,
      })
      success('Reason added', 'The group can see it now.')
      setReasonOptionId(null)
      setNote('')
      setSourceUrl('')
      setStance('for')
    } catch (cause) {
      error('Could not add reason', cause instanceof Error ? cause.message : 'Please try again.')
    } finally {
      setReasonPending(false)
    }
  }

  async function castVote(optionId: string) {
    if (!userId || !optionIds.has(optionId) || votePending) return
    setVotePending(optionId)
    try {
      if (myVote) {
        if (myVote.data.optionId === optionId) return
        await updateVote(myVote.recordId, { optionId })
        success('Vote changed', 'Your updated choice is visible to the group.')
      } else {
        await createVote({ boardId, optionId, userId })
        success('Vote recorded', 'Your choice is visible to the group.')
      }
    } catch (cause) {
      error('Could not record vote', cause instanceof Error ? cause.message : 'Please try again.')
    } finally {
      setVotePending(null)
    }
  }

  async function saveOutcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!board || !canRecordOutcome) return
    if (!outcome.trim()) {
      setOutcomeValidation('Write the decision and a short reason for it.')
      return
    }
    setOutcomeValidation('')
    setOutcomePending(true)
    try {
      await updateBoard(boardId, { status: 'decided', decision: outcome.trim() })
      success('Outcome recorded', 'Everyone on this board can read the final call.')
      setShowOutcome(false)
    } catch (cause) {
      error('Could not save outcome', cause instanceof Error ? cause.message : 'Please try again.')
    } finally {
      setOutcomePending(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      success('Link copied', 'Share it with someone who can sign in to Proofboard.')
    } catch {
      error('Could not copy link', 'Copy the URL from your browser instead.')
    }
  }

  if (boardStatus === 'loading') {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-5 py-12 sm:px-8">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="h-24 max-w-2xl animate-pulse rounded bg-muted" />
        <div className="h-56 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (boardStatus === 'error') {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h1 className="text-2xl font-semibold">Could not load this board</h1>
        <p className="mt-3 text-muted-foreground">{boardError ?? 'Please reload and try again.'}</p>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to boards
        </Link>
        <h1 className="mt-12 text-3xl font-semibold tracking-[-0.05em]">Board not found</h1>
        <p className="mt-3 text-muted-foreground">
          This decision may have been removed, or the link is incomplete.
        </p>
      </div>
    )
  }

  const loadError = optionError ?? evidenceError ?? voteError
  const hasDataError = [optionStatus, evidenceStatus, voteStatus].includes('error')

  return (
    <div className="min-h-full bg-background px-5 pb-20 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden /> All boards
        </Link>

        <div className="mt-8 grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Decision room
              </p>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {board.data.status === 'decided' ? 'Outcome recorded' : 'Open for input'}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">
              {board.data.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {board.data.question}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Users className="size-4" aria-hidden /> Viewing now
            </div>
            <p className="mt-3 text-sm text-foreground">
              {connected
                ? `${peers.length + 1} ${peers.length === 0 ? 'person' : 'people'} here`
                : 'Connecting…'}
            </p>
            {peers.length > 0 && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                You and {peers.map((peer) => peer.userName).join(', ')}
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={copyLink}>
              <ClipboardCopy className="size-3.5" aria-hidden /> Copy board link
            </Button>
          </div>
        </div>

        {board.data.context && (
          <div className="mt-8 rounded-lg border-l-2 border-primary bg-card px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Context</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">
              {board.data.context}
            </p>
          </div>
        )}

        {board.data.status === 'decided' && (
          <section
            className="mt-8 rounded-lg border border-primary/30 bg-secondary/55 p-6"
            aria-label="Recorded outcome"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Recorded outcome
            </p>
            <p className="mt-3 whitespace-pre-wrap text-lg font-medium leading-relaxed">
              {board.data.decision}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              The board stays open for follow-up reasons and votes.
            </p>
          </section>
        )}

        <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              On the table
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
              Options <span className="text-muted-foreground">({options.length})</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {canRecordOutcome && options.length > 0 && (
              <Button
                variant="outline"
                disabled={!boardReady}
                onClick={() => {
                  setOutcome(board.data.decision)
                  setShowOutcome(true)
                }}
              >
                {board.data.status === 'decided' ? 'Edit outcome' : 'Record outcome'}
              </Button>
            )}
            <Button disabled={!optionReady} onClick={() => setShowOption(true)}>
              <Plus className="size-4" aria-hidden /> Add option
            </Button>
          </div>
        </div>

        {hasDataError && (
          <p
            role="alert"
            className="mt-5 rounded-md border border-destructive/40 bg-card px-4 py-3 text-sm text-destructive"
          >
            Could not load all board activity. {loadError ?? 'Reload and try again.'}
          </p>
        )}

        {optionStatus === 'loading' ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : options.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-border bg-card p-5">
            <EmptyState
              icon={<Layers3 />}
              title="Start with the alternatives"
              description="Add the first option so your group has something concrete to compare."
              action={{ label: 'Add option', onClick: () => setShowOption(true) }}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {options.map((option, index) => {
              const optionEvidence = evidence.filter(
                (item) => item.data.optionId === option.recordId,
              )
              const count = validVotes.filter(
                (item) => item.data.optionId === option.recordId,
              ).length
              const selected = myVote?.data.optionId === option.recordId
              const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0
              return (
                <article
                  key={option.recordId}
                  className={`rounded-lg border bg-card p-6 ${selected ? 'border-primary/70 shadow-[0_10px_28px_-24px_rgba(24,57,57,0.5)]' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-bold tracking-[0.18em] text-primary">
                      OPTION {String(index + 1).padStart(2, '0')}
                    </span>
                    {selected && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <Check className="size-3.5" aria-hidden /> Your vote
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em]">
                    {option.data.title}
                  </h3>
                  {option.data.detail && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {option.data.detail}
                    </p>
                  )}
                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {voteStatus === 'ready'
                          ? `${count} ${count === 1 ? 'vote' : 'votes'}`
                          : 'Loading votes…'}
                      </span>
                      <span>{voteStatus === 'ready' ? `${percent}%` : ''}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <Button
                      variant={selected ? 'secondary' : 'default'}
                      size="sm"
                      className="mt-4"
                      disabled={!voteReady || voteStatus !== 'ready' || !!votePending || selected}
                      loading={votePending === option.recordId}
                      onClick={() => castVote(option.recordId)}
                    >
                      {selected ? 'Your choice' : myVote ? 'Change vote' : 'Vote for this'}
                    </Button>
                  </div>
                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Reasons <span className="tracking-normal">({optionEvidence.length})</span>
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!evidenceReady}
                        onClick={() => {
                          setReasonOptionId(option.recordId)
                          setReasonValidation('')
                        }}
                      >
                        <Plus className="size-3.5" aria-hidden /> Add reason
                      </Button>
                    </div>
                    {evidenceStatus === 'loading' ? (
                      <div className="mt-3 h-10 animate-pulse rounded bg-muted" />
                    ) : optionEvidence.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No reasons yet. Add a point for or against this option.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {optionEvidence.map((item) => {
                          const safeLink = item.data.sourceUrl ? httpUrl(item.data.sourceUrl) : null
                          return (
                            <div key={item.recordId} className="rounded-md bg-background px-4 py-3">
                              <span
                                className={`text-[11px] font-bold uppercase tracking-[0.12em] ${item.data.stance === 'for' ? 'text-primary' : 'text-destructive'}`}
                              >
                                {item.data.stance === 'for' ? 'For' : 'Concern'}
                              </span>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                                {item.data.note}
                              </p>
                              {safeLink && (
                                <a
                                  href={safeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  Source <ArrowUpRight className="size-3" aria-hidden />
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        {optionStatus === 'ready' && options.length > 0 && (
          <p className="mt-5 text-sm text-muted-foreground">
            {voteStatus === 'ready'
              ? `${totalVotes} ${totalVotes === 1 ? 'person has' : 'people have'} voted.`
              : 'Votes are loading.'}{' '}
            You can change your choice as the reasons develop.
          </p>
        )}
      </div>

      <Modal open={showOption} onClose={() => setShowOption(false)} size="md">
        <Modal.Header>
          <Modal.Title>Add an option</Modal.Title>
          <Modal.Description>Give everyone a concrete alternative to consider.</Modal.Description>
        </Modal.Header>
        <form onSubmit={addOption}>
          <Modal.Body className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="option-title">Option name</Label>
              <Input
                id="option-title"
                value={optionTitle}
                onChange={(event) => setOptionTitle(event.target.value)}
                maxLength={100}
                placeholder="A short, clear option"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option-detail">
                Detail <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="option-detail"
                value={optionDetail}
                onChange={(event) => setOptionDetail(event.target.value)}
                maxLength={700}
                rows={4}
                placeholder="What would this look like in practice?"
              />
            </div>
            {optionValidation && (
              <p role="alert" className="text-sm text-destructive">
                {optionValidation}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setShowOption(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={optionPending} disabled={!optionReady}>
              Add option
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal open={!!reasonOptionId} onClose={() => setReasonOptionId(null)} size="md">
        <Modal.Header>
          <Modal.Title>Add a reason</Modal.Title>
          <Modal.Description>
            {reasonOption
              ? `Help the group weigh “${reasonOption.data.title}”.`
              : 'Help the group weigh this option.'}
          </Modal.Description>
        </Modal.Header>
        <form onSubmit={addReason}>
          <Modal.Body className="space-y-5">
            <div>
              <Label>Is this a benefit or a concern?</Label>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={stance === 'for' ? 'default' : 'outline'}
                  aria-pressed={stance === 'for'}
                  onClick={() => setStance('for')}
                >
                  For this option
                </Button>
                <Button
                  variant={stance === 'against' ? 'default' : 'outline'}
                  aria-pressed={stance === 'against'}
                  onClick={() => setStance('against')}
                >
                  A concern
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-note">Your reason</Label>
              <Textarea
                id="reason-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={600}
                rows={4}
                placeholder="What should others know?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason-source">
                Source link <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="reason-source"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                maxLength={500}
                placeholder="https://…"
              />
            </div>
            {reasonValidation && (
              <p role="alert" className="text-sm text-destructive">
                {reasonValidation}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setReasonOptionId(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={reasonPending} disabled={!evidenceReady}>
              Add reason
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal open={showOutcome} onClose={() => setShowOutcome(false)} size="md">
        <Modal.Header>
          <Modal.Title>
            {board.data.status === 'decided' ? 'Edit outcome' : 'Record outcome'}
          </Modal.Title>
          <Modal.Description>
            Write the call in your own words. This stays visible above the options.
          </Modal.Description>
        </Modal.Header>
        <form onSubmit={saveOutcome}>
          <Modal.Body className="space-y-3">
            <Label htmlFor="board-outcome">Decision and reasoning</Label>
            <Textarea
              id="board-outcome"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              maxLength={1200}
              rows={6}
              placeholder="We chose… because…"
            />
            {outcomeValidation && (
              <p role="alert" className="text-sm text-destructive">
                {outcomeValidation}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Recording an outcome does not lock follow-up input.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setShowOutcome(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={outcomePending} disabled={!boardReady}>
              Save outcome
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}
