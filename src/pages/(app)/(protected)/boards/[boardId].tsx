import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutations, useQuery } from 'deepspace'
import { ArrowLeft, ArrowUpRight, Layers3, Plus } from 'lucide-react'
import { Button, EmptyState, Input, Label, Modal, Textarea, useToast } from '../../../../components/ui'
import type { Board, Option } from '../../../../proofboard-types'

export default function BoardPage() {
  const { boardId = '' } = useParams<{ boardId: string }>()
  const { records: boards, status: boardStatus } = useQuery<Board>('boards')
  const { records: options, status: optionStatus } = useQuery<Option>('options', {
    where: { boardId },
    orderBy: 'createdAt',
  })
  const { createConfirmed } = useMutations<Option>('options')
  const { success, error } = useToast()
  const [showOption, setShowOption] = useState(false)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [validation, setValidation] = useState('')
  const [creating, setCreating] = useState(false)
  const board = boards.find((item) => item.recordId === boardId)

  async function addOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setValidation('Give this option a name.')
      return
    }
    setValidation('')
    setCreating(true)
    try {
      await createConfirmed({ boardId, title: title.trim(), detail: detail.trim() })
      success('Option added', 'Everyone on this board can see it now.')
      setShowOption(false)
      setTitle('')
      setDetail('')
    } catch (cause) {
      error('Could not add option', cause instanceof Error ? cause.message : 'Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (boardStatus === 'loading') {
    return <div className="mx-auto max-w-6xl space-y-5 px-5 py-12 sm:px-8"><div className="h-8 w-44 animate-pulse rounded bg-muted" /><div className="h-24 max-w-2xl animate-pulse rounded bg-muted" /><div className="h-56 animate-pulse rounded bg-muted" /></div>
  }

  if (!board) {
    return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><Link to="/home" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft className="size-4" /> Back to boards</Link><h1 className="mt-12 text-3xl font-semibold tracking-[-0.05em]">Board not found</h1><p className="mt-3 text-muted-foreground">This decision may have been removed, or the link is incomplete.</p></div>
  }

  return (
    <div className="min-h-full bg-background px-5 pb-20 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" aria-hidden /> All boards</Link>
        <div className="mt-8 grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Decision room</p><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{board.data.status === 'decided' ? 'Decided' : 'Open for input'}</span></div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">{board.data.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{board.data.question}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground"><span className="block text-xs font-bold uppercase tracking-[0.16em] text-primary">Before choosing</span><p className="mt-3">Put the real alternatives on the table. Every voice should be able to see the same question.</p></div>
        </div>

        {board.data.context && <div className="mt-8 rounded-lg border-l-2 border-primary bg-card px-6 py-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Context</p><p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">{board.data.context}</p></div>}

        <div className="mt-12 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">On the table</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Options <span className="text-muted-foreground">({options.length})</span></h2></div><Button onClick={() => setShowOption(true)}><Plus className="size-4" aria-hidden /> Add option</Button></div>

        {optionStatus === 'loading' ? <div className="mt-5 grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-44 animate-pulse rounded-lg bg-muted" />)}</div> : options.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-border bg-card p-5"><EmptyState icon={<Layers3 />} title="Start with the alternatives" description="Add the first option so your group has something concrete to compare." action={{ label: 'Add option', onClick: () => setShowOption(true) }} /></div> : <div className="mt-5 grid gap-4 md:grid-cols-2">{options.map((option, index) => <article key={option.recordId} className="rounded-lg border border-border bg-card p-6"><div className="flex items-start justify-between gap-4"><span className="text-xs font-bold tracking-[0.18em] text-primary">OPTION {String(index + 1).padStart(2, '0')}</span><ArrowUpRight className="size-4 text-muted-foreground" aria-hidden /></div><h3 className="mt-5 text-xl font-semibold tracking-[-0.04em]">{option.data.title}</h3>{option.data.detail && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{option.data.detail}</p>}</article>)}</div>}
      </div>

      <Modal open={showOption} onClose={() => setShowOption(false)} size="md">
        <Modal.Header><Modal.Title>Add an option</Modal.Title><Modal.Description>Give everyone a concrete alternative to consider.</Modal.Description></Modal.Header>
        <form onSubmit={addOption}>
          <Modal.Body className="space-y-5"><div className="space-y-2"><Label htmlFor="option-title">Option name</Label><Input id="option-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="A short, clear option" /></div><div className="space-y-2"><Label htmlFor="option-detail">Detail <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="option-detail" value={detail} onChange={(event) => setDetail(event.target.value)} maxLength={700} rows={4} placeholder="What would this look like in practice?" /></div>{validation && <p role="alert" className="text-sm text-destructive">{validation}</p>}</Modal.Body>
          <Modal.Footer><Button variant="ghost" onClick={() => setShowOption(false)}>Cancel</Button><Button type="submit" loading={creating}>Add option</Button></Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}
