import { SUBJECTS, type Activity, type Subject, type WeeklyPlan } from './types'

type ActivitySeed = Omit<Activity, 'id' | 'subject' | 'minutes'>

export const SUBJECT_META: Record<Subject, { color: string; pale: string; place: string; description: string }> = {
  语文: { color: '#d66f53', pale: '#fae7df', place: '故事溪谷', description: '表达、儿歌、中文阅读与叙事' },
  数学: { color: '#d99b32', pale: '#f9edd3', place: '数量丘陵', description: '数量、形状、分类与空间关系' },
  英语: { color: '#4f86bd', pale: '#e1edf7', place: '双语港湾', description: '语音感知、词汇理解与自然表达' },
  艺术: { color: '#a56bb1', pale: '#f0e4f3', place: '彩色花园', description: '音乐、色彩、材料与自由创作' },
  运动: { color: '#488766', pale: '#dfeee6', place: '活力原野', description: '大运动、精细动作与身体协调' },
  思维: { color: '#7066ad', pale: '#e9e6f4', place: '思考森林', description: '规律、因果、序列与解决问题' },
  科学: { color: '#398d8e', pale: '#dff0ed', place: '发现湿地', description: '自然观察、实验与提出问题' },
}

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const library: Record<Subject, ActivitySeed[]> = {
  语文: [
    {
      title: '绘本寻宝：找一找再讲一讲', format: '共同阅读',
      goal: '理解画面信息，并用词语或短句描述人物与事件。',
      value: '把词语放回共同关注的画面，也练习轮流说话与倾听。',
      props: ['孩子自选绘本1本', '便签3张'],
      steps: ['从两本书里选一本，让孩子当“找图小队长”。', '先看封面，请孩子指出一个人物或物品。', '每读两页停一次，等五秒，让孩子自己找熟悉的东西。', '选一页问“她在做什么”，把回答自然扩成完整短句。', '合上书，请孩子选最喜欢的一页再讲一次。'],
      fallback: '坐不住时只看三页，指出喜欢的画面就结束。',
    },
    {
      title: '玩具剧场：然后发生了什么', format: '游戏',
      goal: '用动作或短句表达“先—再”两步小故事。',
      value: '假想游戏能把生活经验变成有顺序的表达。',
      props: ['玩偶2个', '小碗或积木'],
      steps: ['摆出两个玩偶，请孩子决定今天谁是主角。', '示范两步剧情，清楚说出“先……再……”。', '把玩偶交给孩子，请孩子决定下一件事。', '只追问一次“然后呢”，接受动作、词语或短句。', '一起复述刚才的小故事，不纠正故事是否合理。'],
      fallback: '只完成两个动作，也算完成。',
    },
  ],
  数学: [
    {
      title: '点心小掌柜：数到五', format: '游戏',
      goal: '在真实分物中建立1–5的数量对应。',
      value: '一边数一边移动物品，比只背数字更能理解数量。',
      props: ['积木或大号玩具食物5个', '盘子2个'],
      steps: ['准备五个安全的大件物品。', '示范拿一个放入盘中，边移动边数“1”。', '请孩子按指令给玩偶两个，再逐个点数。', '换成三至五中的一个数量，数错时排开重数。', '让孩子当掌柜，决定给照护者几个。'],
      fallback: '只练1–3，每次把物品排开后再数。',
    },
    {
      title: '形状停车场', format: '精细运动',
      goal: '按圆形、方形或三角形进行匹配与分类。',
      value: '分类帮助孩子看见共同特征，为后续比较打基础。',
      props: ['积木或形状卡', '白纸3张', '蜡笔'],
      steps: ['在纸上画圆、方形和三角形停车位。', '先沿圆形边摸一圈，说“没有角”。', '每次拿一个物品送回对应停车位。', '故意放错一个，请孩子帮忙检查。', '一起数每个停车位有几个。'],
      fallback: '只用圆形和方形两类，每类两个物品。',
    },
  ],
  英语: [
    {
      title: 'Picture walk：看图说词', format: '共同阅读',
      goal: '在情境中理解并回应3–5个熟悉英语词。',
      value: '把英语放进共同注意的画面，减少开口压力。',
      props: ['熟悉的英文绘本1本'],
      steps: ['先只看图，不急着读全文。', '指一个熟悉物品，说词语和一个短句。', '问“Where is…”，指出就算回应。', '把一个词放进动作里，如看到jump就一起跳。', '结束前重复今天最喜欢的三个词。'],
      fallback: '只找两个熟悉词，孩子用手指出即可。',
    },
    {
      title: 'Action game：听口令动起来', format: '大运动',
      goal: '理解并执行简单英语动作口令。',
      value: '动作帮助孩子直接理解语言，不必逐字翻译。',
      props: ['一小块安全空地'],
      steps: ['示范stand up、sit down、clap和turn around。', '一次只说一个口令，完成后描述孩子做对了什么。', '熟悉后给两步口令，语速慢并停顿。', '交换角色，让孩子给照护者发口令。', '用high five结束。'],
      fallback: '只做stand up和sit down两个动作。',
    },
  ],
  艺术: [
    {
      title: '线条去散步', format: '艺术创作',
      goal: '模仿直线、曲线和圆形，并自由赋予意义。',
      value: '涂画练习手眼协调，也让孩子看见动作留下的痕迹。',
      props: ['大张纸', '粗蜡笔3支', '可擦桌垫'],
      steps: ['固定好纸，让孩子从三支蜡笔里选一支。', '先画一条直线，说“小路往前走”。', '请孩子模仿，再画一条弯弯的线。', '一起画大圆，问“它可以变成什么”。', '请孩子给作品取一个名字。'],
      fallback: '只自由涂画两分钟，描述孩子画出的线条。',
    },
    {
      title: '厨房节奏乐队', format: '游戏',
      goal: '模仿快慢、强弱和停顿的节奏。',
      value: '等待、模仿和停下能调动身体控制与工作记忆。',
      props: ['木勺', '塑料盒或安全小鼓'],
      steps: ['检查器具无尖角，约定只敲指定盒子。', '敲“咚—咚”，请孩子照样敲两下。', '改成一快一慢，让孩子听完再敲。', '加入举手就停、放手继续的规则。', '让孩子当小指挥，照护者跟随。'],
      fallback: '只玩敲两下和停下两个规则。',
    },
  ],
  运动: [
    {
      title: '森林小路：跨、跳、绕', format: '大运动',
      goal: '练习双脚跳、跨越与改变方向。',
      value: '多种移动方式能发展平衡、协调和身体计划能力。',
      props: ['靠垫2个', '纸胶带', '玩偶1个'],
      steps: ['清走尖硬物，用胶带贴一条小路。', '完整走一遍：沿线走、跨靠垫、双脚跳。', '孩子行动时站在侧后方保护。', '第二轮抱玩偶走到终点。', '结束后具体描述孩子完成的动作。'],
      fallback: '只沿线走并跨过一个扁靠垫。',
    },
    {
      title: '袜子球投篮', format: '大运动',
      goal: '练习双手投掷、距离判断与轮流。',
      value: '安全投掷让孩子协调上肢动作，也自然练习等待。',
      props: ['卷起的袜子3双', '洗衣篮'],
      steps: ['把袜子卷成软球，篮子放在约一米处。', '示范一次双手从胸前向前投。', '孩子每投一个就自己捡回。', '连续偏远时把篮子移近。', '最后轮流各投一次并一起收拾。'],
      fallback: '把篮子放到半米内，允许直接放进去。',
    },
  ],
  思维: [
    {
      title: '玩具回家：按规则分类', format: '游戏',
      goal: '根据颜色、用途或大小中的一个规则分类。',
      value: '先理解一种规则，再尝试换规则，是灵活思考的基础。',
      props: ['不同玩具6个', '篮子2个'],
      steps: ['选六个安全玩具，让孩子自由看一遍。', '提出一个规则，如“有轮子的放这里”。', '每次拿一个，请孩子说或指出理由。', '故意放错一个，请孩子当检查员。', '精力好时再换一个规则。'],
      fallback: '只用四个玩具和一个分类规则。',
    },
    {
      title: '缺了谁：记忆小侦探', format: '游戏',
      goal: '记住三个物品，并发现被拿走的一个。',
      value: '练习保持信息，也练习等待后再行动。',
      props: ['熟悉玩具3个', '小毛巾'],
      steps: ['摆出三个玩具，逐个说名字。', '用毛巾盖住，请孩子等待“好了”。', '偷偷拿走一个再揭开。', '猜不出时给声音或用途提示。', '交换角色，让孩子藏一个。'],
      fallback: '只用两个玩具，并让孩子看着拿走。',
    },
  ],
  科学: [
    {
      title: '浮还是沉：浅水实验', format: '生活探索',
      goal: '观察三种物品在水中的现象并做简单预测。',
      value: '先猜、再试、再描述，是幼儿科学探索的自然起点。',
      props: ['一盆浅水', '塑料盖', '木积木', '小石头', '毛巾'],
      steps: ['把浅水盆放在防滑地面，全程陪同。', '拿塑料盖问“会在上面还是下面”。', '让孩子轻放入水，再描述浮或沉。', '依次试另外两件，每次都先猜。', '把结果分成“浮”和“沉”两边。'],
      fallback: '只比较塑料盖和小石头。',
    },
    {
      title: '叶子观察站', format: '生活探索',
      goal: '比较叶子的颜色、大小与纹理。',
      value: '观察真实自然物，能积累比较词，也保护好奇心。',
      props: ['安全落叶2–3片', '白纸', '放大镜（可选）'],
      steps: ['在安全处捡两三片落叶，不采陌生植物。', '放在白纸上，自由摸一摸。', '把两片一端对齐比较大小。', '对着光看叶脉，用手指沿一条叶脉走。', '请孩子选最喜欢的一片并说理由。'],
      fallback: '只观察一片安全叶子，说出一种颜色。',
    },
  ],
}

function localIso(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function getWeekStart(reference = new Date()) {
  const result = new Date(reference)
  const weekday = result.getDay() || 7
  result.setDate(result.getDate() - weekday + 1)
  return localIso(result)
}

export function getAgeMonths(birthDate: string) {
  if (!birthDate) return null
  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth() - (now.getDate() < birth.getDate() ? 1 : 0))
}

export function getStage(months: number | null) {
  if (months === null) return { label: '待设置月龄', minutes: 10, instruction: '先示范，再邀请孩子一起做' }
  if (months < 30) return { label: '24–29个月', minutes: 10, instruction: '一次一件事，必要时示范后一起做' }
  if (months < 36) return { label: '30–35个月', minutes: 12, instruction: '使用清楚的两步指令，做完一步再提醒下一步' }
  if (months < 48) return { label: '36–47个月', minutes: 15, instruction: '鼓励孩子先说计划，再独立完成一部分' }
  return { label: '48个月以上', minutes: 18, instruction: '用开放问题引导孩子解释自己的做法' }
}

export function generatePlan(months: number | null, selected: Subject[] = [...SUBJECTS], revision = 0, source = '年龄阶段与所选领域'): WeeklyPlan {
  const subjects = selected.length ? selected : [...SUBJECTS]
  const weekStart = getWeekStart()
  const start = new Date(`${weekStart}T00:00:00`)
  const stage = getStage(months)
  const days = WEEKDAYS.map((weekday, dayIndex) => {
    const date = new Date(start)
    date.setDate(start.getDate() + dayIndex)
    const items = Array.from({ length: 4 }, (_, slot) => {
      const sequence = dayIndex * 4 + slot
      const subject = subjects[(sequence + revision) % subjects.length]
      const seeds = library[subject]
      const seed = seeds[(Math.floor(sequence / subjects.length) + dayIndex + revision) % seeds.length]
      return {
        ...seed,
        id: `activity-${weekStart}-r${revision}-d${dayIndex}-s${slot}`,
        subject,
        minutes: stage.minutes,
        steps: seed.steps.map((step, index) => index === 0 ? `${step}（${stage.instruction}。）` : step),
      }
    })
    return { dayIndex, weekday, date: localIso(date), items }
  })
  return { version: 1, revision, weekStart, selectedSubjects: subjects, completedItemIds: [], days, generatedFrom: source }
}

export function todayIso() {
  return localIso(new Date())
}
