import { groupConversations } from './index'

export function generateDemoData() {
  const conversations = [
    {
      address: '+8613800138000',
      name: '亲爱的TA',
      messages: [
        ...generateWarmingPhase(),
        ...generatePeakPhase(),
        ...generateCoolingPhase(),
        ...generateReconciliationPhase(),
        ...generateStablePhase()
      ]
    },
    {
      address: '+8613900139000',
      name: '小傲娇',
      messages: [
        { id: '101', body: '哼，不理你了！', date: Date.now() - 86400000 * 20, type: 1, isSent: false, isReceived: true },
        { id: '102', body: '怎么啦，我错了还不行吗 😢', date: Date.now() - 86400000 * 20 + 60000, type: 2, isSent: true, isReceived: false },
        { id: '103', body: '哪里错了？', date: Date.now() - 86400000 * 20 + 120000, type: 1, isSent: false, isReceived: true },
        { id: '104', body: '我哪里都错了，不该让你不高兴的', date: Date.now() - 86400000 * 20 + 180000, type: 2, isSent: true, isReceived: false },
        { id: '105', body: '哼，算你识相。下次不许了！', date: Date.now() - 86400000 * 20 + 300000, type: 1, isSent: false, isReceived: true },
        { id: '106', body: '你最好了，原谅我嘛好不好', date: Date.now() - 86400000 * 18, type: 2, isSent: true, isReceived: false },
        { id: '107', body: '不要撒娇，没用的', date: Date.now() - 86400000 * 18 + 60000, type: 1, isSent: false, isReceived: true },
        { id: '108', body: '嘤嘤嘤，人家错了嘛 🥺', date: Date.now() - 86400000 * 18 + 120000, type: 2, isSent: true, isReceived: false },
      ]
    },
    {
      address: '+8613700137000',
      name: '欢喜冤家',
      messages: [
        { id: '201', body: '你能不能别这么笨！', date: Date.now() - 86400000 * 40, type: 1, isSent: false, isReceived: true },
        { id: '202', body: '我怎么笨了？你才笨！', date: Date.now() - 86400000 * 40 + 30000, type: 2, isSent: true, isReceived: false },
        { id: '203', body: '说谁呢你！找打是吧？', date: Date.now() - 86400000 * 40 + 60000, type: 1, isSent: false, isReceived: true },
        { id: '204', body: '我说你呢，笨蛋笨蛋大笨蛋！', date: Date.now() - 86400000 * 40 + 90000, type: 2, isSent: true, isReceived: false },
        { id: '205', body: '你死定了！绝交！', date: Date.now() - 86400000 * 40 + 120000, type: 1, isSent: false, isReceived: true },
        { id: '206', body: '对不起对不起，我错了，别不理我', date: Date.now() - 86400000 * 40 + 300000, type: 2, isSent: true, isReceived: false },
        { id: '207', body: '晚了！', date: Date.now() - 86400000 * 40 + 360000, type: 1, isSent: false, isReceived: true },
        { id: '208', body: '我请你吃一周的奶茶！', date: Date.now() - 86400000 * 40 + 420000, type: 2, isSent: true, isReceived: false },
        { id: '209', body: '两周！', date: Date.now() - 86400000 * 40 + 480000, type: 1, isSent: false, isReceived: true },
        { id: '210', body: '成交！你最最好了！', date: Date.now() - 86400000 * 40 + 540000, type: 2, isSent: true, isReceived: false },
      ]
    },
    {
      address: '+8613600136000',
      name: '温柔的人',
      messages: [
        { id: '301', body: '今天天气真好，想和你一起散步', date: Date.now() - 86400000 * 50, type: 2, isSent: true, isReceived: false },
        { id: '302', body: '好呀，晚上吃完饭一起吧', date: Date.now() - 86400000 * 50 + 600000, type: 1, isSent: false, isReceived: true },
        { id: '303', body: '和你在一起的每一天都很开心', date: Date.now() - 86400000 * 45, type: 2, isSent: true, isReceived: false },
        { id: '304', body: '我也是，谢谢你出现在我的生命里', date: Date.now() - 86400000 * 45 + 300000, type: 1, isSent: false, isReceived: true },
        { id: '305', body: '晚安，愿你做个好梦', date: Date.now() - 86400000 * 42, type: 2, isSent: true, isReceived: false },
        { id: '306', body: '晚安，梦里有你就是好梦', date: Date.now() - 86400000 * 42 + 120000, type: 1, isSent: false, isReceived: true },
        { id: '307', body: '想你了，真的好想', date: Date.now() - 86400000 * 35, type: 1, isSent: false, isReceived: true },
        { id: '308', body: '我也想你，等我忙完这段时间就去陪你', date: Date.now() - 86400000 * 35 + 180000, type: 2, isSent: true, isReceived: false },
      ]
    }
  ]
  
  return groupConversations(conversations.flatMap(c => 
    c.messages.map(m => ({
      ...m,
      address: c.address,
      threadId: c.address
    }))
  ))
}

function generateWarmingPhase() {
  const baseTime = Date.now() - 86400000 * 90
  const messages = []
  
  for (let i = 0; i < 7; i++) {
    const dayTime = baseTime + 86400000 * i
    messages.push(
      { id: `w-${i}-1`, body: '早安呀，今天也要加油哦', date: dayTime + 3600000 * 8, type: 2, isSent: true, isReceived: false },
      { id: `w-${i}-2`, body: '早安~ 你也是', date: dayTime + 3600000 * 8 + 300000, type: 1, isSent: false, isReceived: true }
    )
    
    if (i % 2 === 0) {
      messages.push(
        { id: `w-${i}-3`, body: '今天忙吗？', date: dayTime + 3600000 * 12, type: 2, isSent: true, isReceived: false },
        { id: `w-${i}-4`, body: '还好，想你了', date: dayTime + 3600000 * 12 + 120000, type: 1, isSent: false, isReceived: true }
      )
    }
  }
  
  return messages
}

function generatePeakPhase() {
  const baseTime = Date.now() - 86400000 * 80
  const messages = []
  
  for (let i = 0; i < 14; i++) {
    const dayTime = baseTime + 86400000 * i
    messages.push(
      { id: `p-${i}-1`, body: '早安亲爱的，想你了', date: dayTime + 3600000 * 7, type: 2, isSent: true, isReceived: false },
      { id: `p-${i}-2`, body: '早安宝宝，我也想你呀', date: dayTime + 3600000 * 7 + 60000, type: 1, isSent: false, isReceived: true },
      { id: `p-${i}-3`, body: '今天也要好好吃饭哦', date: dayTime + 3600000 * 12, type: 1, isSent: false, isReceived: true },
      { id: `p-${i}-4`, body: '知道啦，你也是，心疼你', date: dayTime + 3600000 * 12 + 60000, type: 2, isSent: true, isReceived: false }
    )
    
    if (i % 3 === 0) {
      messages.push(
        { id: `p-${i}-5`, body: '晚上一起看电影好不好？', date: dayTime + 3600000 * 15, type: 1, isSent: false, isReceived: true },
        { id: `p-${i}-6`, body: '好呀好呀，好久没约会了', date: dayTime + 3600000 * 15 + 120000, type: 2, isSent: true, isReceived: false }
      )
    }
    
    messages.push(
      { id: `p-${i}-7`, body: '晚安，梦里见 🌙', date: dayTime + 3600000 * 23, type: 2, isSent: true, isReceived: false },
      { id: `p-${i}-8`, body: '晚安亲爱的，爱你 ❤️', date: dayTime + 3600000 * 23 + 60000, type: 1, isSent: false, isReceived: true }
    )
  }
  
  return messages
}

function generateCoolingPhase() {
  const baseTime = Date.now() - 86400000 * 60
  const messages = []
  
  for (let i = 0; i < 14; i++) {
    const dayTime = baseTime + 86400000 * i
    
    if (i % 2 === 0) {
      messages.push(
        { id: `c-${i}-1`, body: '早安', date: dayTime + 3600000 * 9, type: 2, isSent: true, isReceived: false },
        { id: `c-${i}-2`, body: '早', date: dayTime + 3600000 * 10, type: 1, isSent: false, isReceived: true }
      )
    }
    
    if (i % 3 === 0) {
      messages.push(
        { id: `c-${i}-3`, body: '最近忙吗？', date: dayTime + 3600000 * 14, type: 1, isSent: false, isReceived: true },
        { id: `c-${i}-4`, body: '嗯，挺忙的', date: dayTime + 3600000 * 16, type: 2, isSent: true, isReceived: false }
      )
    }
    
    if (i === 5) {
      messages.push(
        { id: `c-${i}-5`, body: '你最近怎么都不怎么理我', date: dayTime + 3600000 * 20, type: 1, isSent: false, isReceived: true },
        { id: `c-${i}-6`, body: '我都说了很忙啊', date: dayTime + 3600000 * 21, type: 2, isSent: true, isReceived: false },
        { id: `c-${i}-7`, body: '随便你吧', date: dayTime + 3600000 * 21 + 60000, type: 1, isSent: false, isReceived: true }
      )
    }
    
    if (i === 10) {
      messages.push(
        { id: `c-${i}-8`, body: '我们是不是需要聊聊', date: dayTime + 3600000 * 19, type: 1, isSent: false, isReceived: true },
        { id: `c-${i}-9`, body: '再说吧，我累了', date: dayTime + 3600000 * 20, type: 2, isSent: true, isReceived: false }
      )
    }
  }
  
  return messages
}

function generateReconciliationPhase() {
  const baseTime = Date.now() - 86400000 * 40
  const messages = []
  
  for (let i = 0; i < 7; i++) {
    const dayTime = baseTime + 86400000 * i
    
    if (i === 0) {
      messages.push(
        { id: `r-${i}-1`, body: '对不起，最近是我不好', date: dayTime + 3600000 * 20, type: 2, isSent: true, isReceived: false },
        { id: `r-${i}-2`, body: '...', date: dayTime + 3600000 * 20 + 300000, type: 1, isSent: false, isReceived: true },
        { id: `r-${i}-3`, body: '我知道我忽略了你，原谅我好不好', date: dayTime + 3600000 * 20 + 600000, type: 2, isSent: true, isReceived: false },
        { id: `r-${i}-4`, body: '你知道我有多难过吗', date: dayTime + 3600000 * 21, type: 1, isSent: false, isReceived: true }
      )
    }
    
    if (i === 1) {
      messages.push(
        { id: `r-${i}-1`, body: '真的很对不起，我以后不会了', date: dayTime + 3600000 * 10, type: 2, isSent: true, isReceived: false },
        { id: `r-${i}-2`, body: '我想你了', date: dayTime + 3600000 * 12, type: 1, isSent: false, isReceived: true },
        { id: `r-${i}-3`, body: '我也想你，超级想', date: dayTime + 3600000 * 12 + 60000, type: 2, isSent: true, isReceived: false }
      )
    }
    
    if (i >= 2) {
      messages.push(
        { id: `r-${i}-4`, body: '早安，想你', date: dayTime + 3600000 * 8, type: 2, isSent: true, isReceived: false },
        { id: `r-${i}-5`, body: '早安~ 今天一起吃饭好不好', date: dayTime + 3600000 * 8 + 120000, type: 1, isSent: false, isReceived: true },
        { id: `r-${i}-6`, body: '好呀，我也想见你', date: dayTime + 3600000 * 8 + 180000, type: 2, isSent: true, isReceived: false }
      )
      
      if (i >= 4) {
        messages.push(
          { id: `r-${i}-7`, body: '晚安，我爱你', date: dayTime + 3600000 * 23, type: 2, isSent: true, isReceived: false },
          { id: `r-${i}-8`, body: '晚安，我也爱你', date: dayTime + 3600000 * 23 + 60000, type: 1, isSent: false, isReceived: true }
        )
      }
    }
  }
  
  return messages
}

function generateStablePhase() {
  const baseTime = Date.now() - 86400000 * 30
  const messages = []
  
  for (let i = 0; i < 25; i++) {
    const dayTime = baseTime + 86400000 * i
    messages.push(
      { id: `s-${i}-1`, body: '早安宝宝', date: dayTime + 3600000 * 7.5, type: 2, isSent: true, isReceived: false },
      { id: `s-${i}-2`, body: '早安亲爱的', date: dayTime + 3600000 * 7.5 + 60000, type: 1, isSent: false, isReceived: true }
    )
    
    if (i % 2 === 0) {
      messages.push(
        { id: `s-${i}-3`, body: '中午吃的什么呀', date: dayTime + 3600000 * 12, type: 1, isSent: false, isReceived: true },
        { id: `s-${i}-4`, body: '吃的面条，你呢', date: dayTime + 3600000 * 12 + 120000, type: 2, isSent: true, isReceived: false }
      )
    }
    
    if (i % 3 === 0) {
      messages.push(
        { id: `s-${i}-5`, body: '想你了', date: dayTime + 3600000 * 16, type: 2, isSent: true, isReceived: false },
        { id: `s-${i}-6`, body: '我也想你，抱抱', date: dayTime + 3600000 * 16 + 60000, type: 1, isSent: false, isReceived: true }
      )
    }
    
    messages.push(
      { id: `s-${i}-7`, body: '晚安，好梦', date: dayTime + 3600000 * 22.5, type: 2, isSent: true, isReceived: false },
      { id: `s-${i}-8`, body: '晚安，爱你', date: dayTime + 3600000 * 22.5 + 60000, type: 1, isSent: false, isReceived: true }
    )
  }
  
  return messages
}
