const WARMING_KEYWORDS = [
  { pattern: /想你|想念|好想你|miss you/gi, weight: 3 },
  { pattern: /我爱你|love you|喜欢你|爱你/gi, weight: 5 },
  { pattern: /抱抱|亲亲|么么哒|mua/gi, weight: 3 },
  { pattern: /亲爱的|宝贝|宝宝/gi, weight: 2 },
  { pattern: /晚安|好梦|good night/gi, weight: 1.5 },
  { pattern: /心疼|担心|挂念/gi, weight: 2 },
  { pattern: /照顾好|注意身体|多穿点/gi, weight: 1.5 },
  { pattern: /一起|约会|见面|看电影|吃饭/gi, weight: 2 },
]

const COOLING_KEYWORDS = [
  { pattern: /哼|讨厌|不理你|绝交|分手|再也不/gi, weight: 3 },
  { pattern: /随便你|无所谓|关你屁事|不关你事/gi, weight: 4 },
  { pattern: /你能不能|你总是|你怎么|凭什么/gi, weight: 2 },
  { pattern: /忙|没时间|再说吧|算了/gi, weight: 2 },
  { pattern: /别烦我|走开|滚/gi, weight: 5 },
]

const RECONCILIATION_KEYWORDS = [
  { pattern: /对不起|抱歉|sorry|我错了/gi, weight: 3 },
  { pattern: /原谅|别生气|消消气/gi, weight: 3 },
  { pattern: /和好|和解|我们和好吧/gi, weight: 5 },
  { pattern: /想你了|我想你了/gi, weight: 2 },
  { pattern: /抱抱|别难过|安慰你/gi, weight: 2 },
]

function calculateMessageScore(msg, keywordList) {
  if (!msg.body) return 0
  let score = 0
  for (const kw of keywordList) {
    const matches = msg.body.match(kw.pattern)
    if (matches) {
      score += kw.weight * matches.length
    }
  }
  return score
}

function groupByPeriod(messages, periodDays = 7) {
  const periodMs = periodDays * 86400000
  const groups = []
  if (messages.length === 0) return groups

  const sorted = [...messages].sort((a, b) => a.date - b.date)
  const startTime = sorted[0].date

  let currentGroup = {
    periodIndex: 0,
    startDate: startTime,
    endDate: startTime + periodMs,
    messages: []
  }

  for (const msg of sorted) {
    while (msg.date >= currentGroup.endDate) {
      if (currentGroup.messages.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = {
        periodIndex: currentGroup.periodIndex + 1,
        startDate: currentGroup.endDate,
        endDate: currentGroup.endDate + periodMs,
        messages: []
      }
    }
    currentGroup.messages.push(msg)
  }

  if (currentGroup.messages.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

function calculatePeriodStats(period) {
  const messages = period.messages
  if (messages.length === 0) {
    return { ...period, warmthScore: 0, coolScore: 0, interactionScore: 0, totalScore: 0 }
  }

  let warmthScore = 0
  let coolScore = 0
  let replyCount = 0
  let avgReplyTime = 0

  for (let i = 0; i < messages.length; i++) {
    warmthScore += calculateMessageScore(messages[i], WARMING_KEYWORDS)
    coolScore += calculateMessageScore(messages[i], COOLING_KEYWORDS)

    if (i > 0) {
      const timeDiff = messages[i].date - messages[i - 1].date
      if (timeDiff < 3600000 && messages[i].isSent !== messages[i - 1].isSent) {
        replyCount++
        avgReplyTime += timeDiff
      }
    }
  }

  const interactionScore = replyCount > 0 
    ? Math.min(10, replyCount / Math.max(1, messages.length / 5)) 
    : 0

  const totalScore = warmthScore - coolScore * 0.5 + interactionScore * 2

  return {
    ...period,
    warmthScore,
    coolScore,
    interactionScore,
    replyCount,
    avgReplyTime: replyCount > 0 ? avgReplyTime / replyCount : 0,
    totalScore
  }
}

function findTurningPoints(periods) {
  const nodes = []
  if (periods.length < 2) return nodes

  for (let i = 1; i < periods.length; i++) {
    const prev = periods[i - 1]
    const curr = periods[i]

    const scoreDiff = curr.totalScore - prev.totalScore
    const changeRatio = prev.totalScore !== 0 ? scoreDiff / Math.abs(prev.totalScore) : 0

    if (scoreDiff > 3 && changeRatio > 0.3) {
      const representativeMsg = findRepresentativeMessage(curr, 'warming')
      nodes.push({
        type: 'warming',
        label: '升温',
        icon: '🔥',
        periodIndex: i,
        date: curr.startDate,
        scoreDiff,
        changeRatio,
        description: generateWarmingDescription(curr, prev),
        representativeMessage: representativeMsg,
        messages: curr.messages,
        period: curr
      })
    }

    if (scoreDiff < -3 && changeRatio < -0.3) {
      const representativeMsg = findRepresentativeMessage(curr, 'cooling')
      nodes.push({
        type: 'cooling',
        label: '冷淡',
        icon: '❄️',
        periodIndex: i,
        date: curr.startDate,
        scoreDiff,
        changeRatio,
        description: generateCoolingDescription(curr, prev),
        representativeMessage: representativeMsg,
        messages: curr.messages,
        period: curr
      })
    }
  }

  for (let i = 2; i < periods.length; i++) {
    const prevPrev = periods[i - 2]
    const prev = periods[i - 1]
    const curr = periods[i]

    const wasCooling = prev.totalScore - prevPrev.totalScore < -2
    const nowWarming = curr.totalScore - prev.totalScore > 2
    const hasReconciliation = hasReconciliationKeywords(curr)

    if (wasCooling && (nowWarming || hasReconciliation)) {
      const representativeMsg = findRepresentativeMessage(curr, 'reconciliation')
      const existingNode = nodes.find(n => n.periodIndex === i && n.type === 'warming')
      
      if (existingNode) {
        existingNode.type = 'reconciliation'
        existingNode.label = '和好'
        existingNode.icon = '🌈'
        existingNode.description = generateReconciliationDescription(curr, prev)
        existingNode.representativeMessage = representativeMsg
      } else {
        nodes.push({
          type: 'reconciliation',
          label: '和好',
          icon: '🌈',
          periodIndex: i,
          date: curr.startDate,
          scoreDiff: curr.totalScore - prev.totalScore,
          changeRatio: prev.totalScore !== 0 ? (curr.totalScore - prev.totalScore) / Math.abs(prev.totalScore) : 0,
          description: generateReconciliationDescription(curr, prev),
          representativeMessage: representativeMsg,
          messages: curr.messages,
          period: curr
        })
      }
    }
  }

  nodes.sort((a, b) => a.date - b.date)
  return nodes
}

function hasReconciliationKeywords(period) {
  for (const msg of period.messages) {
    if (calculateMessageScore(msg, RECONCILIATION_KEYWORDS) > 0) {
      return true
    }
  }
  return false
}

function findRepresentativeMessage(period, type) {
  const messages = period.messages
  if (messages.length === 0) return null

  let keywordList
  if (type === 'warming') keywordList = WARMING_KEYWORDS
  else if (type === 'cooling') keywordList = COOLING_KEYWORDS
  else keywordList = [...RECONCILIATION_KEYWORDS, ...WARMING_KEYWORDS]

  const scoredMessages = messages.map(msg => ({
    msg,
    score: calculateMessageScore(msg, keywordList),
    isSent: msg.isSent,
    hasKeywords: calculateMessageScore(msg, keywordList) > 0
  }))

  scoredMessages.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.hasKeywords !== a.hasKeywords) return b.hasKeywords ? 1 : -1
    return 0
  })

  let bestMsg = null
  const threshold = type === 'cooling' ? 1 : 2
  
  for (const sm of scoredMessages) {
    if (sm.score >= threshold) {
      bestMsg = sm.msg
      break
    }
  }

  if (!bestMsg) {
    for (const sm of scoredMessages) {
      if (sm.score > 0) {
        bestMsg = sm.msg
        break
      }
    }
  }

  if (!bestMsg) {
    const nonEmptyMessages = messages.filter(m => m.body && m.body.trim().length > 0)
    if (nonEmptyMessages.length > 0) {
      const midIndex = Math.floor(nonEmptyMessages.length / 2)
      bestMsg = nonEmptyMessages[midIndex]
    } else {
      const midIndex = Math.floor(messages.length / 2)
      bestMsg = messages[midIndex]
    }
  }

  return bestMsg
}

function getContextMessages(period, centerMsg, contextSize = 2) {
  const messages = period.messages
  const centerIndex = messages.findIndex(m => m.id === centerMsg?.id)
  
  if (centerIndex === -1) {
    return messages.slice(0, Math.min(5, messages.length))
  }
  
  const startIdx = Math.max(0, centerIndex - contextSize)
  const endIdx = Math.min(messages.length, centerIndex + contextSize + 1)
  
  return messages.slice(startIdx, endIdx)
}

function generateWarmingDescription(curr, prev) {
  const warmthIncrease = curr.warmthScore - prev.warmthScore
  const interactionIncrease = curr.replyCount - prev.replyCount

  const parts = []
  if (warmthIncrease > 2) parts.push(`甜言蜜语增加了 ${warmthIncrease.toFixed(0)} 分`)
  if (interactionIncrease > 0) parts.push(`互动频率提升`)
  if (curr.avgReplyTime < prev.avgReplyTime && curr.avgReplyTime > 0) parts.push(`回复速度变快`)

  if (parts.length === 0) parts.push('关系进入升温期')

  return parts.join('，')
}

function generateCoolingDescription(curr, prev) {
  const coolIncrease = curr.coolScore - prev.coolScore
  const warmthDecrease = prev.warmthScore - curr.warmthScore

  const parts = []
  if (coolIncrease > 1) parts.push(`出现了 ${coolIncrease.toFixed(0)} 分的冷淡迹象`)
  if (warmthDecrease > 2) parts.push(`甜言蜜语减少`)
  if (curr.replyCount < prev.replyCount) parts.push(`互动频率下降`)

  if (parts.length === 0) parts.push('关系进入冷淡期')

  return parts.join('，')
}

function generateReconciliationDescription(curr, prev) {
  const parts = []
  
  let apologyCount = 0
  for (const msg of curr.messages) {
    if (/(对不起|抱歉|我错了|原谅)/.test(msg.body || '')) {
      apologyCount++
    }
  }

  if (apologyCount > 0) parts.push(`有 ${apologyCount} 次道歉`)
  parts.push('关系回暖')
  parts.push('重新变得亲密')

  return parts.join('，')
}

const timelineDetector = {
  name: 'timeline',
  label: '关系时间轴',
  description: '分析对话中的关系变化节点',

  detect(conversation) {
    const messages = conversation.messages
    if (messages.length < 5) {
      return {
        score: 0,
        tags: [],
        timelineNodes: [],
        periods: []
      }
    }

    let periodDays = 7
    const totalDays = (conversation.endTime - conversation.startTime) / 86400000
    
    if (totalDays < 14) periodDays = 2
    else if (totalDays < 30) periodDays = 3
    else if (totalDays < 90) periodDays = 7
    else periodDays = 14

    const rawPeriods = groupByPeriod(messages, periodDays)
    const periods = rawPeriods.map(p => calculatePeriodStats(p))
    const nodes = findTurningPoints(periods)

    let score = nodes.length * 20
    const tags = []

    const hasWarming = nodes.some(n => n.type === 'warming' || n.type === 'reconciliation')
    const hasCooling = nodes.some(n => n.type === 'cooling')

    if (hasWarming && hasCooling) {
      tags.push('有起有伏')
      score += 10
    }
    if (nodes.filter(n => n.type === 'reconciliation').length >= 1) {
      tags.push('分分合合')
      score += 15
    }
    if (nodes.filter(n => n.type === 'warming').length >= 2) {
      tags.push('持续升温')
      score += 10
    }

    return {
      score,
      tags,
      timelineNodes: nodes,
      periods
    }
  },

  generateTimeline(conversation) {
    return this.detect(conversation)
  }
}

export default timelineDetector
