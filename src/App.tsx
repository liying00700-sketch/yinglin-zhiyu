import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  HeartHandshake,
  Home,
  Map as MapIcon,
  MessageCircleMore,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sprout,
  TreePine,
  UserRound,
} from 'lucide-react'
import { clearState, emptyState, loadState, saveState } from './storage'
import ParentingQA from './ParentingQA'
import ProductHome from './ProductHome'
import { SUBJECTS, type Activity, type CareFeedback, type Evidence, type GrowthState, type Subject, type View, type WeeklyPlan } from './types'
import { generatePlan, getAgeMonths, getStage, getWeekStart, SUBJECT_META, todayIso } from './weeklyPlan'

const navItems: Array<{ id: View; label: string; short: string; icon: typeof Home }> = [
  { id: 'home', label: '产品首页', short: '首页', icon: Home },
  { id: 'qa', label: '育儿问答', short: '问一问', icon: MessageCircleMore },
  { id: 'overview', label: '学习成长', short: '成长', icon: TreePine },
  { id: 'plan', label: '本周计划', short: '计划', icon: CalendarDays },
  { id: 'care', label: '今日陪伴', short: '陪伴', icon: HeartHandshake },
  { id: 'review', label: '成长回看', short: '回看', icon: MapIcon },
  { id: 'profile', label: '孩子档案', short: '档案', icon: UserRound },
]

function buildEvidence(state: GrowthState): Evidence[] {
  const plans = [...state.planArchives, ...(state.plan ? [state.plan] : [])]
  const uniquePlans = Array.from(new Map(plans.map((plan) => [`${plan.weekStart}:${plan.revision}`, plan])).values())
  return uniquePlans.flatMap((plan) => plan.days.flatMap((day) => day.items
    .filter((item) => plan.completedItemIds.includes(item.id))
    .map((item) => {
      const feedback = [...state.feedback].reverse().find((record) => record.completedItemIds.includes(item.id))
      return {
        id: item.id,
        date: day.date,
        subject: item.subject,
        title: item.title,
        minutes: item.minutes,
        caregiver: feedback?.caregiver || state.profile.caregiver || '家人',
        response: feedback?.response,
        difficulty: feedback?.difficulty,
        note: feedback?.note,
      }
    })))
}

function formatShortDate(value: string) {
  if (!value) return ''
  const [, month, day] = value.split('-')
  return `${Number(month)}月${Number(day)}日`
}

function responseText(value?: CareFeedback['response']) {
  return value === 'engaged' ? '很投入' : value === 'resistant' ? '有些抗拒' : value === 'neutral' ? '平静跟随' : '待观察'
}

function difficultyText(value?: CareFeedback['difficulty']) {
  return value === 'hard' ? '有点难' : value === 'easy' ? '有点简单' : value === 'right' ? '刚刚好' : '未记录'
}

function EmptyProfile({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="profile-gate">
      <div className="gate-mark"><Sprout size={28} /></div>
      <span>先认识孩子，再安排这一周</span>
      <h2>告诉我们孩子的出生日期，<br />活动才会落在合适的节奏里。</h2>
      <p>昵称可以留空，也不需要填写姓名、住址等身份信息。所有内容只保存在当前浏览器。</p>
      <button className="primary-button" onClick={onOpen}>设置孩子档案 <ArrowRight size={16} /></button>
    </section>
  )
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="page-intro">
      <div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action && <div className="page-action">{action}</div>}
    </header>
  )
}

function ActivityCard({ item, done, saving = false, onToggle, caregiverMode = false }: { item: Activity; done: boolean; saving?: boolean; onToggle: (id: string) => void; caregiverMode?: boolean }) {
  const meta = SUBJECT_META[item.subject]
  return (
    <article className={`activity-card ${done ? 'done' : ''}`} style={{ '--subject': meta.color, '--subject-pale': meta.pale } as CSSProperties}>
      <div className="activity-topline">
        <span className="subject-badge"><i />{item.subject} · {item.format} · {item.minutes}分钟</span>
        <button className="complete-button" disabled={saving} onClick={() => onToggle(item.id)} aria-pressed={done}>
          {done ? <><Check size={15} /> 已记录</> : '记录完成'}
        </button>
      </div>
      <h3>{item.title}</h3>
      <div className="activity-facts">
        <div><span>这次做什么</span><p>{item.goal}</p></div>
        <div><span>为什么值得做</span><p>{item.value}</p></div>
        <div><span>准备</span><p>{item.props.join('、')}</p></div>
      </div>
      <details open={caregiverMode ? undefined : false}>
        <summary>{caregiverMode ? '照着这五步做' : '查看具体做法'} <ChevronRight size={15} /></summary>
        <ol>{item.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
        <div className="fallback"><strong>孩子今天不想做？</strong><p>{item.fallback}</p></div>
      </details>
    </article>
  )
}

function Overview({ state, evidence, onNavigate }: { state: GrowthState; evidence: Evidence[]; onNavigate: (view: View) => void }) {
  const [days, setDays] = useState<7 | 30>(30)
  const [subject, setSubject] = useState<'全部' | Subject>('全部')
  const end = todayIso()
  const startDate = new Date(`${end}T00:00:00`)
  startDate.setDate(startDate.getDate() - days + 1)
  const start = startDate.toLocaleDateString('en-CA')
  const visible = evidence.filter((item) => item.date >= start && item.date <= end && (subject === '全部' || item.subject === subject))
  const points = new Set(visible.map((item) => `${item.subject}:${item.title}`)).size
  const minutes = visible.reduce((sum, item) => sum + item.minutes, 0)
  const covered = new Set(visible.map((item) => item.subject)).size
  const subjectCounts = SUBJECTS.reduce((result, item) => ({ ...result, [item]: visible.filter((record) => record.subject === item).length }), {} as Record<Subject, number>)
  const nickname = state.profile.nickname || '孩子'

  if (!state.profile.birthDate) return <EmptyProfile onOpen={() => onNavigate('profile')} />

  return (
    <>
      <PageIntro
        eyebrow={`${nickname}的成长 · ${getAgeMonths(state.profile.birthDate)}个月`}
        title="每一次陪伴，都留下可以回看的证据。"
        description="这里记录孩子遇见过什么、愿意投入什么，以及下一周可以怎样轻轻调整。一次完成只是一次经历，不代表已经掌握。"
        action={<button className="quiet-button" onClick={() => onNavigate('care')}>去记录今天 <ArrowRight size={15} /></button>}
      />

      <section className="overview-hero">
        <div className="week-note">
          <span className="section-kicker">这一周期</span>
          <h2>{visible.length ? `已经留下 ${visible.length} 次真实学习经历` : '先从一次真实陪伴开始'}</h2>
          <p>{visible.length
            ? covered === 7 ? '七个领域都有了新的观察。接下来不必加量，看看孩子在哪些活动里更主动。' : `已经遇见 ${covered} 个领域。记录较少只说明观察机会少，不代表能力弱。`
            : '空白图表不会判断孩子。完成一项活动并留下一句话，成长地图才开始有意义。'}</p>
          <div className="period-switch"><button className={days === 7 ? 'active' : ''} onClick={() => setDays(7)}>最近7天</button><button className={days === 30 ? 'active' : ''} onClick={() => setDays(30)}>最近30天</button></div>
        </div>
        <div className="growth-orbit" aria-label="七领域成长地图">
          <button className={`orbit-center ${subject === '全部' ? 'active' : ''}`} onClick={() => setSubject('全部')}><TreePine size={26} /><strong>全部经历</strong><span>{visible.length}次</span></button>
          {SUBJECTS.map((item, index) => {
            const angle = (index / SUBJECTS.length) * Math.PI * 2 - Math.PI / 2
            const left = 50 + Math.cos(angle) * 41
            const top = 50 + Math.sin(angle) * 41
            const meta = SUBJECT_META[item]
            return <button key={item} className={`orbit-node ${subject === item ? 'active' : ''} ${subject !== '全部' && subject !== item ? 'muted' : ''}`} style={{ left: `${left}%`, top: `${top}%`, '--subject': meta.color, '--subject-pale': meta.pale } as CSSProperties} onClick={() => setSubject(item)}><i /><strong>{item}</strong><span>{subjectCounts[item]}次</span></button>
          })}
        </div>
      </section>

      <section className="metric-row" aria-label="成长数据摘要">
        <div><span>学习经历</span><strong>{visible.length}</strong><small>完成一次，记一次证据</small></div>
        <div><span>不同学习点</span><strong>{points}</strong><small>不重复活动主题</small></div>
        <div><span>陪伴投入</span><strong>{minutes}<em>分钟</em></strong><small>按计划时长估算</small></div>
        <div><span>覆盖领域</span><strong>{covered}<em>/7</em></strong><small>不是达标分数</small></div>
      </section>

      <section className="evidence-section panel">
        <div className="panel-title"><div><span className="section-kicker">成长足迹</span><h2>{subject === '全部' ? '最近发生过什么' : `${SUBJECT_META[subject].place} · ${subject}观察`}</h2></div><span className="status-pill">{visible.length} 条</span></div>
        {visible.length ? <div className="evidence-list">{[...visible].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((item) => (
          <article key={item.id} style={{ '--subject': SUBJECT_META[item.subject].color } as CSSProperties}>
            <i />
            <div><span>{formatShortDate(item.date)} · {item.subject} · {item.caregiver}</span><h3>{item.title}</h3>{item.note && <p>“{item.note}”</p>}</div>
            <aside><strong>{item.minutes}分钟</strong><span>{responseText(item.response)}</span></aside>
          </article>
        ))}</div> : <div className="empty-state"><Sprout size={25} /><strong>{subject === '全部' ? '这个周期还没有成长记录' : `${subject}还没有新的观察`}</strong><p>可以扩大到最近30天，或从本周计划完成一次活动。</p><button className="quiet-button" onClick={() => onNavigate('plan')}>看看本周计划</button></div>}
      </section>
    </>
  )
}

function WeeklyPlanner({ state, setState, onNavigate, notify }: { state: GrowthState; setState: (updater: (current: GrowthState) => GrowthState) => void; onNavigate: (view: View) => void; notify: (message: string) => void }) {
  const [dayIndex, setDayIndex] = useState(0)
  const [selected, setSelected] = useState<Subject[]>(state.plan?.selectedSubjects || [...SUBJECTS])
  const months = getAgeMonths(state.profile.birthDate)
  const stage = getStage(months)
  const plan = state.plan

  useEffect(() => {
    if (plan) setSelected(plan.selectedSubjects)
  }, [plan?.revision, plan?.weekStart])

  if (!state.profile.birthDate) return <EmptyProfile onOpen={() => onNavigate('profile')} />

  function createPlan() {
    setState((current) => ({ ...current, plan: generatePlan(months, selected) }))
    notify('本周计划已生成')
  }

  function regenerate() {
    const completed = plan?.completedItemIds.length || 0
    if (completed && !window.confirm(`当前已有 ${completed} 项完成记录。旧计划会保留在成长历史中，继续换一套吗？`)) return
    const nextRevision = (plan?.revision || 0) + 1
    setState((current) => ({
      ...current,
      planArchives: current.plan ? [...current.planArchives, current.plan].slice(-20) : current.planArchives,
      plan: generatePlan(months, selected, nextRevision, '年龄阶段、所选领域与近期观察'),
    }))
    setDayIndex(0)
    notify('已换成一套新的本周计划')
  }

  function toggleSubject(subject: Subject) {
    setSelected((current) => current.includes(subject)
      ? current.length === 1 ? current : current.filter((item) => item !== subject)
      : SUBJECTS.filter((item) => [...current, subject].includes(item)))
  }

  function toggleItem(id: string) {
    setState((current) => {
      if (!current.plan) return current
      const done = current.plan.completedItemIds.includes(id)
      return { ...current, plan: { ...current.plan, completedItemIds: done ? current.plan.completedItemIds.filter((item) => item !== id) : [...current.plan.completedItemIds, id] } }
    })
  }

  return (
    <>
      <PageIntro eyebrow={`本周计划 · ${stage.label}`} title="把七个领域，散进日常的好时段。" description={`每天四项活动候选，每项约${stage.minutes}分钟。它们不需要连续完成；孩子明显疲惫或抗拒时，简化或停止都可以。`} action={<button className="quiet-button" onClick={() => onNavigate('care')}>切换到照护视图</button>} />

      <section className="plan-builder panel">
        <div className="panel-title"><div><span className="section-kicker">定制本周</span><h2>这周想多留意哪些领域？</h2></div>{plan && <span className="status-pill">{plan.completedItemIds.length}/28 已完成</span>}</div>
        <div className="subject-picker">{SUBJECTS.map((item) => <button key={item} className={selected.includes(item) ? 'active' : ''} style={{ '--subject': SUBJECT_META[item].color, '--subject-pale': SUBJECT_META[item].pale } as CSSProperties} onClick={() => toggleSubject(item)}><i />{item}<small>{selected.includes(item) ? '已选' : '未选'}</small></button>)}</div>
        <div className="builder-foot"><p>记录少只用于安排更多观察机会，不用来判断孩子是否落后。</p>{plan ? <button className="quiet-button" onClick={regenerate}><RefreshCw size={15} /> 按当前选择换一套</button> : <button className="primary-button" onClick={createPlan}><Sparkles size={16} /> 生成本周计划</button>}</div>
      </section>

      {plan ? <section className="plan-schedule panel">
        {plan.weekStart !== getWeekStart() && <div className="inline-alert"><CircleAlert size={17} /><span>这是从 {plan.weekStart} 开始的旧计划。换一套内容可生成本周日期。</span></div>}
        <div className="panel-title"><div><span className="section-kicker">{plan.weekStart} 开始 · 第 {plan.revision + 1} 版</span><h2>{state.profile.nickname || '孩子'}的七日探索计划</h2></div><span className="status-pill">依据：{plan.generatedFrom}</span></div>
        <nav className="day-tabs" aria-label="选择计划日期">{plan.days.map((day) => {
          const done = day.items.filter((item) => plan.completedItemIds.includes(item.id)).length
          return <button key={day.date} className={day.dayIndex === dayIndex ? 'active' : ''} onClick={() => setDayIndex(day.dayIndex)}><span>{day.weekday}</span><strong>{Number(day.date.slice(-2))}</strong><small>{done}/4</small></button>
        })}</nav>
        <div className="day-heading"><div><span>{plan.days[dayIndex].date}</span><h3>{plan.days[dayIndex].weekday} · 四次短而有趣的陪伴</h3></div><p>可以分散到不同时间。自由游戏和日常生活仍然是孩子重要的学习。</p></div>
        <div className="activity-list">{plan.days[dayIndex].items.map((item) => <ActivityCard key={item.id} item={item} done={plan.completedItemIds.includes(item.id)} onToggle={toggleItem} />)}</div>
      </section> : <div className="empty-plan"><CalendarDays size={28} /><h2>还没有这一周的计划</h2><p>先选至少一个领域，再生成七天活动。计划会保存在当前浏览器。</p></div>}
    </>
  )
}

function CareView({ state, setState, onNavigate, notify }: { state: GrowthState; setState: (updater: (current: GrowthState) => GrowthState) => void; onNavigate: (view: View) => void; notify: (message: string) => void }) {
  const plan = state.plan
  const todayIndex = plan?.days.findIndex((day) => day.date === todayIso()) ?? -1
  const [dayIndex, setDayIndex] = useState(todayIndex >= 0 ? todayIndex : 0)
  const [response, setResponse] = useState<CareFeedback['response']>('engaged')
  const [difficulty, setDifficulty] = useState<CareFeedback['difficulty']>('right')
  const [note, setNote] = useState('')
  const caregiver = state.profile.caregiver || '照护者'

  if (!state.profile.birthDate) return <EmptyProfile onOpen={() => onNavigate('profile')} />
  if (!plan) return <section className="empty-plan"><CalendarDays size={28} /><h2>先请家长生成本周计划</h2><p>照护页面会读取同一份计划，不需要重复录入。</p><button className="primary-button" onClick={() => onNavigate('plan')}>去生成计划</button></section>

  const day = plan.days[dayIndex]
  const completed = day.items.filter((item) => plan.completedItemIds.includes(item.id))
  const lastFeedback = [...state.feedback].reverse().find((item) => item.activityDate === day.date)

  function toggleItem(id: string) {
    setState((current) => {
      if (!current.plan) return current
      const done = current.plan.completedItemIds.includes(id)
      return { ...current, plan: { ...current.plan, completedItemIds: done ? current.plan.completedItemIds.filter((item) => item !== id) : [...current.plan.completedItemIds, id] } }
    })
  }

  function saveFeedback() {
    if (!note.trim()) return
    const observed = completed.length ? completed : day.items
    const record: CareFeedback = {
      id: `feedback-${Date.now()}`,
      activityDate: day.date,
      createdAt: new Date().toISOString(),
      dayIndex,
      caregiver,
      completedItemIds: completed.map((item) => item.id),
      subjects: Array.from(new Set(observed.map((item) => item.subject))),
      response,
      difficulty,
      note: note.trim(),
    }
    setState((current) => ({ ...current, feedback: [...current.feedback, record].slice(-200) }))
    setNote('')
    notify('观察已保存，并进入成长回看')
  }

  return (
    <>
      <PageIntro eyebrow={`${caregiver}入口 · 同一份本周计划`} title={`今天陪 ${state.profile.nickname || '孩子'} 玩一点什么？`} description="按孩子当天的状态选择，不追求全部完成。每项都有具体步骤和简化版，完成后留下一句真实观察。" action={<button className="quiet-button" onClick={() => onNavigate('plan')}>返回家长规划</button>} />
      <section className="care-week panel">
        <div className="panel-title"><div><span className="section-kicker">本周进度</span><h2>已经完成 {plan.completedItemIds.length} / 28 项</h2></div><div className="progress-ring"><strong>{plan.completedItemIds.length}</strong><span>本周完成</span></div></div>
        <nav className="day-tabs" aria-label="选择陪伴日期">{plan.days.map((item) => {
          const done = item.items.filter((activity) => plan.completedItemIds.includes(activity.id)).length
          return <button key={item.date} className={item.dayIndex === dayIndex ? 'active' : ''} onClick={() => setDayIndex(item.dayIndex)}><span>{item.weekday}</span><strong>{Number(item.date.slice(-2))}</strong><small>{done}/4</small></button>
        })}</nav>
        <div className="day-heading"><div><span>{day.date}</span><h3>{day.weekday}的四项陪伴</h3></div><p>上午、午后或傍晚分开进行都可以。</p></div>
        <div className="activity-list">{day.items.map((item) => <ActivityCard key={item.id} item={item} done={plan.completedItemIds.includes(item.id)} onToggle={toggleItem} caregiverMode />)}</div>
      </section>

      <section className="feedback-panel panel">
        <div className="panel-title"><div><span className="section-kicker">完成后说两句</span><h2>{state.profile.nickname || '孩子'}最喜欢什么？哪里有点难？</h2></div><span className="status-pill">已勾选 {completed.length}/4 项</span></div>
        <p className="feedback-help">即使今天一项都没完成，也可以记录原因。这种观察不会算作完成证据，但会帮助下一周调整进入方式。</p>
        <div className="feedback-grid">
          <fieldset><legend>孩子的状态</legend><div className="choice-row"><button className={response === 'engaged' ? 'active' : ''} onClick={() => setResponse('engaged')}>很投入</button><button className={response === 'neutral' ? 'active' : ''} onClick={() => setResponse('neutral')}>平静跟随</button><button className={response === 'resistant' ? 'active' : ''} onClick={() => setResponse('resistant')}>有些抗拒</button></div></fieldset>
          <fieldset><legend>今天的难度</legend><div className="choice-row"><button className={difficulty === 'easy' ? 'active' : ''} onClick={() => setDifficulty('easy')}>有点简单</button><button className={difficulty === 'right' ? 'active' : ''} onClick={() => setDifficulty('right')}>刚刚好</button><button className={difficulty === 'hard' ? 'active' : ''} onClick={() => setDifficulty('hard')}>有点难</button></div></fieldset>
        </div>
        <label className="note-field"><span>一句真实观察</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：她反复把圆形积木放回原位，第三次开始主动说‘这是圆的’。" /></label>
        <button className="primary-button" disabled={!note.trim()} onClick={saveFeedback}><Save size={16} /> 保存观察</button>
        {lastFeedback && <div className="last-feedback"><span>这一天最近保存</span><strong>{responseText(lastFeedback.response)} · {difficultyText(lastFeedback.difficulty)}</strong><p>“{lastFeedback.note}”</p></div>}
      </section>
    </>
  )
}

function ReviewView({ state, evidence, onNavigate }: { state: GrowthState; evidence: Evidence[]; onNavigate: (view: View) => void }) {
  if (!state.profile.birthDate) return <EmptyProfile onOpen={() => onNavigate('profile')} />
  const recentStart = new Date()
  recentStart.setDate(recentStart.getDate() - 29)
  const start = recentStart.toLocaleDateString('en-CA')
  const recent = evidence.filter((item) => item.date >= start)
  const feedback = state.feedback.filter((item) => item.activityDate >= start)
  const engaged = feedback.filter((item) => item.response === 'engaged')
  const challenges = feedback.filter((item) => item.response === 'resistant' || item.difficulty === 'hard')
  const subjectActivity = SUBJECTS.map((subject) => ({ subject, count: recent.filter((item) => item.subject === subject).length }))
  const favorite = [...subjectActivity].sort((a, b) => b.count - a.count)[0]
  const lessSeen = [...subjectActivity].sort((a, b) => a.count - b.count)[0]
  const nickname = state.profile.nickname || '孩子'

  return (
    <>
      <PageIntro eyebrow="最近30天 · 家庭观察" title="把完成、投入和抗拒放在一起看。" description="这里不做诊断，也不把一次完成当成掌握。复盘只帮助家人决定：下周延续什么、降低什么、再观察什么。" />
      <section className="review-lead panel">
        <div className="review-copy"><span className="section-kicker">给下一周的一句话</span><h2>{recent.length ? `${nickname}在${favorite?.subject || '日常活动'}里留下较多经历，${lessSeen?.subject || '其他领域'}可以多给一次轻量观察机会。` : '先积累三到五次真实陪伴，再讨论趋势。'}</h2><p>{challenges.length ? `最近有 ${challenges.length} 条“偏难或抗拒”反馈。下周优先缩短指令、使用简化版，不增加练习压力。` : engaged.length ? `最近有 ${engaged.length} 条“很投入”反馈，可以延续相似材料与互动方式。` : '目前还没有足够的状态反馈，不自动修改计划。'}</p></div>
        <div className="review-stats"><div><strong>{recent.length}</strong><span>学习经历</span></div><div><strong>{feedback.length}</strong><span>照护观察</span></div><div><strong>{challenges.length}</strong><span>需要降阶</span></div></div>
      </section>
      <section className="subject-ledger panel">
        <div className="panel-title"><div><span className="section-kicker">七领域观察册</span><h2>记录分布，而不是能力排名</h2></div></div>
        <div className="ledger-list">{subjectActivity.map(({ subject, count }) => {
          const meta = SUBJECT_META[subject]
          const width = recent.length ? Math.max(5, count / Math.max(...subjectActivity.map((item) => item.count), 1) * 100) : 0
          return <div key={subject} style={{ '--subject': meta.color } as CSSProperties}><span><i />{subject}<small>{meta.description}</small></span><b><em style={{ width: `${width}%` }} /></b><strong>{count}次</strong></div>
        })}</div>
      </section>
      <section className="feedback-timeline panel">
        <div className="panel-title"><div><span className="section-kicker">家人的原话</span><h2>最近的照护观察</h2></div><span className="status-pill">{feedback.length} 条</span></div>
        {feedback.length ? <div className="timeline-list">{[...feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => <article key={item.id}><span>{formatShortDate(item.activityDate)}</span><div><strong>{item.caregiver} · {responseText(item.response)} · {difficultyText(item.difficulty)}</strong><p>“{item.note}”</p><small>{item.subjects.join('、')}</small></div></article>)}</div> : <div className="empty-state"><MessageCircleMore size={24} /><strong>还没有照护观察</strong><p>完成活动后留下一句原话，回看才会保留当时的真实情境。</p><button className="quiet-button" onClick={() => onNavigate('care')}>去记录今天</button></div>}
      </section>
    </>
  )
}

function ProfileView({ state, setState, notify }: { state: GrowthState; setState: (updater: (current: GrowthState) => GrowthState) => void; notify: (message: string) => void }) {
  const [draft, setDraft] = useState(state.profile)
  const months = getAgeMonths(draft.birthDate)
  const stage = getStage(months)

  function saveProfile() {
    if (!draft.birthDate) return
    setState((current) => ({ ...current, profile: draft, plan: current.plan || generatePlan(months) }))
    notify('孩子档案已保存')
  }

  function resetAll() {
    if (!window.confirm('这会清空当前浏览器里的孩子档案、问答、有效方法、计划、完成记录和观察。清空后无法恢复，确定继续吗？')) return
    clearState()
    setState(() => ({ ...emptyState, profile: { ...emptyState.profile }, planArchives: [], feedback: [], questionHistory: [], savedMethods: [] }))
    setDraft({ ...emptyState.profile })
    notify('当前浏览器里的家庭数据已清空')
  }

  return (
    <>
      <PageIntro eyebrow="最小必要资料" title="只留下安排活动真正需要的信息。" description="不填写真实姓名、住址、幼儿园或医疗信息。第一版数据保存在当前浏览器，不会自动同步到其他设备。" />
      <div className="profile-layout">
        <section className="profile-form panel">
          <div className="panel-title"><div><span className="section-kicker">孩子档案</span><h2>认识孩子当前的节奏</h2></div></div>
          <label><span>家庭称呼 <small>可以留空</small></span><input value={draft.nickname} maxLength={12} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} placeholder="例如：小树苗" /></label>
          <label><span>出生日期 <b>必填</b></span><input type="date" value={draft.birthDate} max={todayIso()} onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })} /></label>
          <label><span>主要照护者 <small>用于记录署名</small></span><input value={draft.caregiver} maxLength={12} onChange={(event) => setDraft({ ...draft, caregiver: event.target.value })} placeholder="例如：奶奶、爸爸、妈妈" /></label>
          <label><span>每天可用于结构化活动的时间</span><input type="number" min={10} max={120} step={5} value={draft.dailyMinutes} onChange={(event) => setDraft({ ...draft, dailyMinutes: Number(event.target.value) || 30 })} /></label>
          <button className="primary-button" disabled={!draft.birthDate} onClick={saveProfile}><Save size={16} /> 保存档案</button>
        </section>
        <aside className="profile-summary">
          <section className="age-card"><span>当前活动阶段</span><strong>{months === null ? '待设置' : `${months}个月`}</strong><h3>{stage.label}</h3><p>每项建议约 {stage.minutes} 分钟。月龄只用于调整活动时长和指令复杂度，不用于判断发育是否达标。</p></section>
          <section className="privacy-card"><ShieldCheck size={22} /><div><strong>当前数据边界</strong><p>孩子档案、问答历史、计划和观察都保存在本地浏览器；尚未接入账号、云同步和不同家庭的数据隔离，因此当前版本只适合单设备私用或产品验证。</p></div></section>
          <button className="danger-button" onClick={resetAll}><RotateCcw size={15} /> 清空当前浏览器数据</button>
        </aside>
      </div>
    </>
  )
}

export default function App() {
  const [state, setStateRaw] = useState<GrowthState>(() => loadState())
  const [view, setView] = useState<View>('home')
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  const evidence = useMemo(() => buildEvidence(state), [state])

  useEffect(() => {
    setStorageError(!saveState(state))
  }, [state])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  function setState(updater: (current: GrowthState) => GrowthState) {
    setStateRaw((current) => updater(current))
  }

  function navigate(next: View) {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nickname = state.profile.nickname || '孩子'
  const months = getAgeMonths(state.profile.birthDate)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate('home')} aria-label="回到产品首页"><span className="brand-mark"><TreePine size={22} /></span><span><strong>萤林知育</strong><small>Learning × Parenting</small></span></button>
        <div className="child-chip"><span>{nickname.slice(0, 1) || '萤'}</span><div><strong>{state.profile.birthDate ? `${nickname}的成长空间` : '还没有孩子档案'}</strong><small>{months === null ? '先设置月龄与照护者' : `${months}个月 · ${state.profile.caregiver || '家庭共同照护'}`}</small></div></div>
        <nav>{navItems.map((item) => {
          const Icon = item.icon
          return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === 'care' && state.plan && <em>{state.plan.completedItemIds.length}/28</em>}</button>
        })}</nav>
        <div className="sidebar-note"><Sparkles size={16} /><p>记录少，不等于能力弱。<br />先看见，再轻轻调整。</p></div>
        <footer><ShieldCheck size={15} /><span>当前设备私密保存</span></footer>
      </aside>

      <main>
        <div className="mobile-topbar"><button className="brand" onClick={() => navigate('home')}><span className="brand-mark"><TreePine size={19} /></span><span><strong>萤林知育</strong><small>{nickname} · {months === null ? '待设置档案' : `${months}个月`}</small></span></button><button onClick={() => navigate('profile')} aria-label="打开孩子档案"><UserRound size={20} /></button></div>
        <div className="page-wrap">
          {storageError && <div className="storage-error"><CircleAlert size={17} /><span>浏览器没有保存成功。请检查无痕模式或存储权限，再重试刚才的操作。</span></div>}
          {view === 'home' && <ProductHome state={state} onNavigate={navigate} />}
          {view === 'qa' && <ParentingQA state={state} setState={setState} onNavigate={navigate} notify={setToast} />}
          {view === 'overview' && <Overview state={state} evidence={evidence} onNavigate={navigate} />}
          {view === 'plan' && <WeeklyPlanner state={state} setState={setState} onNavigate={navigate} notify={setToast} />}
          {view === 'care' && <CareView state={state} setState={setState} onNavigate={navigate} notify={setToast} />}
          {view === 'review' && <ReviewView state={state} evidence={evidence} onNavigate={navigate} />}
          {view === 'profile' && <ProfileView state={state} setState={setState} notify={setToast} />}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="产品导航">{navItems.filter((item) => item.id !== 'home' && item.id !== 'profile').map((item) => {
        const Icon = item.icon
        return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><Icon size={19} /><span>{item.short}</span></button>
      })}</nav>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}
