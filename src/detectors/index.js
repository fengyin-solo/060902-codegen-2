import keywordDetector from './keywordDetector.js'
import frequencyDetector from './frequencyDetector.js'
import loveLetterDetector from './loveLetterDetector.js'
import quarrelDetector from './quarrelDetector.js'
import cuteDetector from './cuteDetector.js'
import timelineDetector from './timelineDetector.js'

const detectors = [
  keywordDetector,
  frequencyDetector,
  loveLetterDetector,
  quarrelDetector,
  cuteDetector,
  timelineDetector
]

export function registerDetector(detector) {
  if (detector && typeof detector.name && typeof detector.detect === 'function') {
    detectors.push(detector)
    return true
  }
  return false
}

export function unregisterDetector(detectorName) {
  const idx = detectors.findIndex(d => d.name === detectorName)
  if (idx !== -1) {
    detectors.splice(idx, 1)
    return true
  }
  return false
}

export function getDetectors() {
  return [...detectors]
}

export function runAllDetectors(conversations) {
  const results = []
  
  for (const conv of conversations) {
    const convResult = {
      conversation: conv,
      scores: {},
      tags: [],
      totalScore: 0
    }
    
    for (const detector of detectors) {
      try {
        const result = detector.detect(conv)
        if (result) {
          convResult.scores[detector.name] = result.score || 0
          if (result.tags && result.tags.length > 0) {
            convResult.tags.push(...result.tags)
          }
        }
      } catch (e) {
        console.error(`Detector ${detector.name} error:`, e)
      }
    }
    
    convResult.totalScore = Object.values(convResult.scores).reduce((a, b) => a + b, 0)
    convResult.tags = convResult.tags.flat()
    
    if (convResult.tags.length > 0 || convResult.totalScore > 0) {
      results.push(convResult)
    }
  }
  
  results.sort((a, b) => b.totalScore - a.totalScore)
  
  return results
}

export function analyzeMessageRelationships(conversation) {
  const messages = conversation.messages
  const relationships = []
  
  for (let i = 1; i < messages.length; i++) {
    const current = messages[i]
    const prev = messages[i - 1]
    
    const timeDiff = current.date - prev.date
    const isReply = timeDiff < 3600000
    
    relationships.push({
      from: prev.id,
      to: current.id,
      fromIndex: i - 1,
      toIndex: i,
      timeDiff,
      isReply,
      direction: current.isSent !== prev.isSent ? 'alternate' : 'same',
      type: isReply ? 'reply' : (timeDiff < 86400000 ? 'thread' : 'distant')
    })
  }
  
  return relationships
}

export function findLoveLetters(conversations) {
  const results = runAllDetectors(conversations)
  
  return results
    .filter(r => r.totalScore > 0)
    .map(r => {
      const highlightedMessages = highlightMessages(r.conversation, r.scores)
      const timelineResult = r.scores.timeline
      return {
        ...r,
        highlightedMessages,
        loveScore: r.scores.loveLetter || 0,
        relationships: analyzeMessageRelationships(r.conversation),
        timelineNodes: timelineResult?.timelineNodes || [],
        timelinePeriods: timelineResult?.periods || []
      }
    })
    .sort((a, b) => b.loveScore - a.loveScore)
}

export function generateTimeline(loveLetter) {
  if (!loveLetter || !loveLetter.conversation) {
    return { nodes: [], periods: [] }
  }

  if (loveLetter.timelineNodes && loveLetter.timelinePeriods) {
    return {
      nodes: loveLetter.timelineNodes,
      periods: loveLetter.timelinePeriods
    }
  }

  const result = timelineDetector.detect(loveLetter.conversation)
  return {
    nodes: result.timelineNodes || [],
    periods: result.periods || []
  }
}

export function getAllTimelines(loveLetters) {
  return loveLetters.map(letter => ({
    conversationId: letter.conversation.id,
    conversationName: letter.conversation.name,
    loveScore: letter.loveScore,
    totalScore: letter.totalScore,
    ...generateTimeline(letter)
  })).filter(t => t.nodes.length > 0)
}

function highlightMessages(conversation, scores) {
  return conversation.messages.map(msg => {
    msg.highlights = []
    
    if (msg.body) {
      if (/(想你|想念|好想你|miss you)/i.test(msg.body)) {
        msg.highlights.push({ type: 'miss', text: '思念' })
      }
      if (/(晚安|good night)/i.test(msg.body)) {
        msg.highlights.push({ type: 'night', text: '晚安' })
      }
      if (/(对不起|抱歉|sorry)/i.test(msg.body)) {
        msg.highlights.push({ type: 'sorry', text: '道歉' })
      }
      if (/(我爱你|love you|喜欢你)/i.test(msg.body)) {
        msg.highlights.push({ type: 'love', text: '爱意' })
      }
    }
    
    return msg
  })
}

export default detectors

export {
  keywordDetector,
  frequencyDetector,
  loveLetterDetector,
  quarrelDetector,
  cuteDetector,
  timelineDetector
}
