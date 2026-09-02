import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleAlert,
  Clock3,
  HeartHandshake,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { askParentingAI } from './parentingApi'
import type { GrowthState, ParentingQuestion, QuestionFeedback, View } from './types'
import { getAgeMonths } from './weeklyPlan'

type Stage = 'issue' | 'facts' | 'safety' | 'answer' | 'emergency'

type Draft = {
  issue: string
  duration: string
  frequency: string
  tried: string
  triedFor: string
  outcome: string
  redFlags: string[]
}

const EMPTY_DRAFT: Draft = {
  issue: '',
  duration: '',
  frequency: '',
  tried: '',
  triedFor: '',
  outcome: '',
  redFlags: [],
}

const RED_FLAGS = [
  '呼吸困难、意识异常或抽搐',
  '可能误食、窒息、严重受伤或大量出血',
  '持续自伤或伤人，当前无法保证安全',
]

const EMERGENCY_TERMS = ['喘不上气', '呼吸困难', '没反应', '昏迷', '抽搐', '窒息', '误食', '大量出血']

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function feedbackLabel(value?: QuestionFeedback) {
  if (value === 'trying') return '准备尝试'
  if (value === 'helpful') return '有帮助'
  if (value === 'no_change') return '没明显变化'
  if (value === 'worse') return '情况更糟'
  return '等待反馈'
}

function StepProgress({ stage }: { stage: Stage }) {
  const index = stage === 'issue' ? 1 : stage === 'facts' ? 2 : 3
  return <div className="qa-progress"><span>{index} / 3</span><i><b style={{ width: `${index / 3 * 100}%` }} /></i></div>
}

function History({ state, open }: { state: GrowthState; open: (item: ParentingQuestion) => void }) {
  if (!state.questionHistory.length) return null
  return (
    <section className="qa-history panel">
      <div className="panel-title"><div><span className="section-kicker">过去问过</span><h2>把有效的方法慢慢留下来</h2></div><span className="status-pill">{state.questionHistory.length} 次</span></div>
      <div className="qa-history-list">{state.questionHistory.slice(0, 8).map((item) => (
        <button key={item.id} onClick={() => open(item)}>
          <span>{formatDate(item.askedAt)} · {feedbackLabel(item.feedback)}</span>
          <strong>{item.question}</strong>
          <small>{item.answer.action}</small>
          <ArrowRight size={15} />
        </button>
      ))}</div>
    </section>
  )
}

function AnswerCard({ item, onFeedback }: { item: ParentingQuestion; onFeedback: (value: QuestionFeedback) => void }) {
  const answer = item.answer
  return (
    <>
      <section className="qa-answer panel">
        <header><div><span>{answer.judgment}</span><h1>{answer.title}</h1><p>{answer.empathy}</p></div><Sparkles size={27} /></header>
        <div className="answer-signals"><strong>我为什么这样判断</strong><ul>{answer.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul></div>
        <div className="answer-action"><span>今天只做这一小步</span><h2>{answer.action}</h2></div>
        <div className="answer-grid">
          <article><MessageCircleMore size={20} /><div><span>可以直接这样说</span><p>“{answer.script}”</p></div></article>
          <article><Clock3 size={20} /><div><span>接下来观察什么</span><p>{answer.observe}</p></div></article>
          <article><CircleAlert size={20} /><div><span>什么时候需要升级处理</span><p>{answer.escalation}</p></div></article>
        </div>
        {(answer.sourceNote || item.sources.length > 0) && <footer><BookOpenCheck size={16} /><p>{answer.sourceNote || '本次回答使用了已准入资料。'}{item.sources.length > 0 && <small>参考：{item.sources.map((source) => source.title).join('、')}</small>}</p></footer>}
      </section>

      <section className="qa-feedback panel">
        <div><span className="section-kicker">把建议变成下一次依据</span><h2>{item.feedback ? `当前反馈：${feedbackLabel(item.feedback)}` : '这个方法，你想怎样继续？'}</h2><p>反馈只用于保存这次家庭尝试，不代表效果诊断。</p></div>
        <div className="qa-feedback-actions">
          <button className={item.feedback === 'trying' ? 'active' : ''} onClick={() => onFeedback('trying')}><HeartHandshake size={17} />我愿意试试</button>
          <button className={item.feedback === 'helpful' ? 'active' : ''} onClick={() => onFeedback('helpful')}><Check size={17} />有帮助</button>
          <button className={item.feedback === 'no_change' ? 'active' : ''} onClick={() => onFeedback('no_change')}>没明显变化</button>
          <button className={item.feedback === 'worse' ? 'active danger' : 'danger'} onClick={() => onFeedback('worse')}>情况更糟</button>
        </div>
        {item.feedback === 'no_change' && <div className="qa-followup-note">先不叠加新方法。回看执行时机、照护者说法是否一致，并再记录三次变化。</div>}
        {item.feedback === 'worse' && <div className="qa-followup-note danger"><ShieldAlert size={17} />先停止原来的办法并重新确认安全；若出现呼吸或意识异常、受伤、自伤或伤人，请立即联系当地急救或就近就医。</div>}
      </section>
    </>
  )
}

export default function ParentingQA({
  state,
  setState,
  onNavigate,
  notify,
}: {
  state: GrowthState
  setState: (updater: (current: GrowthState) => GrowthState) => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
}) {
  const [stage, setStage] = useState<Stage>('issue')
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [current, setCurrent] = useState<ParentingQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const months = getAgeMonths(state.profile.birthDate)
  const hasEmergencyWords = useMemo(() => EMERGENCY_TERMS.some((term) => draft.issue.includes(term)), [draft.issue])

  if (!state.profile.birthDate) {
    return <section className="profile-gate"><div className="gate-mark"><MessageCircleMore size={28} /></div><span>先补充孩子的精确月龄</span><h2>同一个问题，在不同月龄里<br />需要不同的判断边界。</h2><p>只需要出生日期和家庭称呼，不填写姓名、住址等身份信息。</p><button className="primary-button" onClick={() => onNavigate('profile')}>设置孩子档案 <ArrowRight size={16} /></button></section>
  }

  function reset() {
    setDraft(EMPTY_DRAFT)
    setCurrent(null)
    setError('')
    setStage('issue')
  }

  function selectSafety(value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      redFlags: value === 'none'
        ? ['none']
        : currentDraft.redFlags.includes(value)
          ? currentDraft.redFlags.filter((item) => item !== value)
          : [...currentDraft.redFlags.filter((item) => item !== 'none'), value],
    }))
  }

  async function submit() {
    if (draft.redFlags.some((item) => item !== 'none') || hasEmergencyWords) {
      setStage('emergency')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await askParentingAI({
        question: draft.issue.trim(),
        profile: {
          ageMonths: String(months),
          duration: draft.duration.trim(),
          frequency: draft.frequency.trim(),
          tried: draft.tried.trim(),
          triedFor: draft.triedFor.trim(),
          outcome: draft.outcome.trim(),
        },
      })
      const item: ParentingQuestion = {
        id: `qa_${Date.now()}`,
        question: draft.issue.trim(),
        askedAt: new Date().toISOString(),
        answer: result.answer,
        sources: result.sources,
      }
      setState((saved) => ({ ...saved, questionHistory: [item, ...saved.questionHistory].slice(0, 50) }))
      setCurrent(item)
      setStage('answer')
      notify('问答已保存到当前浏览器')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '暂时无法生成回答')
    } finally {
      setLoading(false)
    }
  }

  function updateFeedback(value: QuestionFeedback) {
    if (!current) return
    const updated = { ...current, feedback: value }
    setCurrent(updated)
    setState((saved) => {
      const methodExists = saved.savedMethods.some((method) => method.id === current.id)
      return {
        ...saved,
        questionHistory: saved.questionHistory.map((item) => item.id === current.id ? updated : item),
        savedMethods: value === 'helpful'
          ? methodExists
            ? saved.savedMethods
            : [{ id: current.id, question: current.question, action: current.answer.action, savedAt: new Date().toISOString() }, ...saved.savedMethods].slice(0, 30)
          : saved.savedMethods.filter((method) => method.id !== current.id),
      }
    })
    notify(value === 'helpful' ? '有效方法已经收好' : '这次反馈已经记下')
  }

  function openHistory(item: ParentingQuestion) {
    setCurrent(item)
    setStage('answer')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (stage === 'answer' && current) {
    return <><div className="qa-answer-top"><button className="quiet-button" onClick={reset}><RefreshCw size={15} />问另一个问题</button></div><AnswerCard item={current} onFeedback={updateFeedback} /><History state={state} open={openHistory} /></>
  }

  if (stage === 'emergency') {
    return (
      <section className="qa-emergency panel">
        <ShieldAlert size={34} />
        <span>先停止普通育儿建议</span>
        <h1>这一步先确认孩子当下安全。</h1>
        <p>如果孩子正在出现呼吸或意识异常、抽搐、窒息、误食、严重受伤，或持续自伤／伤人且无法保证安全，请立即联系当地急救服务或就近就医，并由成人持续陪同。</p>
        <div><strong>当前页面不会继续生成普通问答。</strong><small>情况稳定后，可以重新描述发生前、发生时和恢复后的变化。</small></div>
        <button className="quiet-button" onClick={reset}><ArrowLeft size={15} />情况稳定，重新描述</button>
      </section>
    )
  }

  const factsReady = Boolean(draft.duration.trim() && draft.frequency.trim() && draft.tried.trim() && draft.triedFor.trim() && draft.outcome.trim())

  return (
    <>
      <header className="qa-intro">
        <div><span>育儿问答 · {months}个月</span><h1>先听清楚发生了什么，<br />再一起找今天的一小步。</h1><p>不做诊断，不替代医生或其他专业服务。回答只使用后台明确允许参与问答的资料；未准入内容不会被检索。</p></div>
        <aside><ShieldAlert size={19} /><p>呼吸或意识异常、误食、严重受伤、自伤或伤人时，请立即联系当地急救或就近就医。</p></aside>
      </header>

      <section className="qa-composer panel">
        <StepProgress stage={stage} />
        {stage === 'issue' && <div className="qa-step">
          <span className="section-kicker">先说最困扰你的事</span>
          <h2>今天，什么情况让你有点拿不准？</h2>
          <textarea autoFocus value={draft.issue} onChange={(event) => setDraft({ ...draft, issue: event.target.value })} maxLength={800} placeholder="例如：最近每次离开游乐场，孩子都会躺地大哭，我不知道该怎么回应……" />
          <small>请不要填写真实姓名、住址、幼儿园或其他身份信息。</small>
          <button className="primary-button" disabled={draft.issue.trim().length < 4} onClick={() => setStage('facts')}>继续补充情况 <ArrowRight size={16} /></button>
        </div>}

        {stage === 'facts' && <div className="qa-step">
          <button className="qa-back" onClick={() => setStage('issue')}><ArrowLeft size={14} />返回修改问题</button>
          <span className="section-kicker">只补充真正影响判断的事实</span>
          <h2>这件事发生多久、出现多频繁？</h2>
          <div className="qa-fields">
            <label><span>持续了多久</span><input value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} placeholder="例如：大约两周" /></label>
            <label><span>发生频率</span><input value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value })} placeholder="例如：几乎每次离开都发生" /></label>
            <label><span>已经尝试过什么</span><input value={draft.tried} onChange={(event) => setDraft({ ...draft, tried: event.target.value })} placeholder="没有尝试过，也请直接填写“还没试过”" /></label>
            <label><span>尝试了多久</span><input value={draft.triedFor} onChange={(event) => setDraft({ ...draft, triedFor: event.target.value })} placeholder="例如：试过三次／还没试过" /></label>
            <label className="wide"><span>结果怎样</span><textarea value={draft.outcome} onChange={(event) => setDraft({ ...draft, outcome: event.target.value })} placeholder="只写你真实看到的变化，不需要猜原因。" /></label>
          </div>
          <button className="primary-button" disabled={!factsReady} onClick={() => setStage('safety')}>继续确认安全 <ArrowRight size={16} /></button>
        </div>}

        {stage === 'safety' && <div className="qa-step">
          <button className="qa-back" onClick={() => setStage('facts')}><ArrowLeft size={14} />返回补充事实</button>
          <span className="section-kicker">回答前的安全确认</span>
          <h2>目前有没有以下任何一种情况？</h2>
          <div className="safety-choices">{RED_FLAGS.map((flag) => <button key={flag} className={draft.redFlags.includes(flag) ? 'active danger' : ''} onClick={() => selectSafety(flag)}><ShieldAlert size={18} /><span>{flag}</span>{draft.redFlags.includes(flag) && <Check size={16} />}</button>)}<button className={draft.redFlags.includes('none') ? 'active safe' : ''} onClick={() => selectSafety('none')}><Check size={18} /><span>目前都没有</span>{draft.redFlags.includes('none') && <Check size={16} />}</button></div>
          {error && <div className="qa-error"><CircleAlert size={17} /><span>{error}</span></div>}
          <button className="primary-button" disabled={!draft.redFlags.length || loading} onClick={submit}>{loading ? <><LoaderCircle className="spin" size={16} />正在整理回答…</> : draft.redFlags.some((item) => item !== 'none') || hasEmergencyWords ? '先查看安全提示' : <>生成一个可执行的回答 <Sparkles size={16} /></>}</button>
        </div>}
      </section>

      <History state={state} open={openHistory} />
    </>
  )
}
