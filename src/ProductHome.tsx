import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  HeartHandshake,
  Map as MapIcon,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Sprout,
} from 'lucide-react'
import type { GrowthState, View } from './types'
import { getAgeMonths } from './weeklyPlan'

export default function ProductHome({ state, onNavigate }: { state: GrowthState; onNavigate: (view: View) => void }) {
  const months = getAgeMonths(state.profile.birthDate)
  const nickname = state.profile.nickname || '孩子'
  const completed = state.plan?.completedItemIds.length || 0
  const observations = state.feedback.length
  const questions = state.questionHistory.length

  return (
    <div className="product-home">
      <section className="brand-hero">
        <div className="brand-hero-copy">
          <span className="brand-eyebrow"><i />儿童学习 × 家庭育儿知识</span>
          <h1>懂育儿，<br />也懂孩子如何学习。</h1>
          <p>萤林知育把零散的育儿知识，变成今天做得到的一小步；再把真实陪伴和家庭观察，沉淀成孩子自己的成长路径。</p>
          <div className="brand-actions">
            <button className="brand-primary" onClick={() => onNavigate('qa')}>从一个困扰开始 <ArrowRight size={17} /></button>
            <button className="brand-secondary" onClick={() => onNavigate(state.profile.birthDate ? 'plan' : 'profile')}>{state.profile.birthDate ? '安排本周学习' : '先建立孩子档案'}</button>
          </div>
          <div className="brand-trust"><ShieldCheck size={16} /><span>不诊断、不排名；紧急信号优先于普通建议。</span></div>
        </div>

        <div className="growth-loop" aria-label="萤林知育知行成长环">
          <div className="loop-orbit loop-orbit-one" />
          <div className="loop-orbit loop-orbit-two" />
          <div className="loop-center"><Sprout size={30} /><strong>知 · 行 · 长</strong><span>家庭成长闭环</span></div>
          <div className="loop-node loop-knowledge"><BookOpenCheck size={17} /><span>先理解</span><strong>育儿知识</strong></div>
          <div className="loop-node loop-action"><Sparkles size={17} /><span>只做一步</span><strong>今日行动</strong></div>
          <div className="loop-node loop-observe"><HeartHandshake size={17} /><span>真实留下</span><strong>家庭观察</strong></div>
          <div className="loop-node loop-learning"><MapIcon size={17} /><span>持续看见</span><strong>学习成长</strong></div>
          <span className="loop-caption loop-caption-a">知识轨</span>
          <span className="loop-caption loop-caption-b">成长轨</span>
        </div>
      </section>

      <section className="two-paths">
        <article className="path-card path-question">
          <div className="path-index">A</div>
          <div><span>现在遇到一个具体困扰</span><h2>先把问题理清楚</h2><p>补充月龄、频率和已经尝试过的方法，先确认安全，再获得一个最小行动和可直接使用的话术。</p></div>
          <button onClick={() => onNavigate('qa')}>进入育儿问答 <ArrowRight size={16} /></button>
        </article>
        <article className="path-card path-learning">
          <div className="path-index">B</div>
          <div><span>想系统陪孩子学习成长</span><h2>把七个领域放进日常</h2><p>按月龄生成一周活动，家人照着做、留下观察，再用孩子自己的记录调整下一周。</p></div>
          <button onClick={() => onNavigate(state.profile.birthDate ? 'overview' : 'profile')}>{state.profile.birthDate ? '查看成长空间' : '建立孩子档案'} <ArrowRight size={16} /></button>
        </article>
      </section>

      <section className="product-proof">
        <header><span>不是堆知识，而是让家庭形成自己的方法</span><h2>从“我该怎么办”，走到“我们知道什么适合自己家”。</h2></header>
        <div className="proof-flow">
          <div><MessageCircleMore size={21} /><strong>问清楚</strong><span>事实与安全边界</span></div>
          <i><ArrowRight size={15} /></i>
          <div><CalendarDays size={21} /><strong>做一步</strong><span>低负担行动计划</span></div>
          <i><ArrowRight size={15} /></i>
          <div><HeartHandshake size={21} /><strong>留观察</strong><span>家人的真实原话</span></div>
          <i><ArrowRight size={15} /></i>
          <div><MapIcon size={21} /><strong>再调整</strong><span>孩子自己的成长证据</span></div>
        </div>
      </section>

      <section className="family-space">
        <div><span>你的家庭成长空间</span><h2>{state.profile.birthDate ? `${nickname} · ${months}个月` : '从一份最小档案开始'}</h2><p>{state.profile.birthDate ? '这里展示家庭自己留下的使用记录，不和其他孩子比较。' : '只记录安排内容真正需要的信息，不填写姓名、住址和幼儿园。'}</p></div>
        <div className="family-numbers">
          <div><strong>{questions}</strong><span>育儿问答</span></div>
          <div><strong>{completed}</strong><span>学习经历</span></div>
          <div><strong>{observations}</strong><span>家庭观察</span></div>
        </div>
        <button className="brand-secondary" onClick={() => onNavigate(state.profile.birthDate ? 'overview' : 'profile')}>{state.profile.birthDate ? '进入成长总览' : '建立孩子档案'} <ArrowRight size={16} /></button>
      </section>
    </div>
  )
}
