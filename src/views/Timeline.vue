<template>
  <div class="timeline-page">
    <div class="timeline-header">
      <h2>📅 关系时间轴</h2>
      <p>记录你们关系的每一个转折点，点击节点查看当时的对话</p>
    </div>

    <div v-if="store.timelines.length === 0 && store.loveLetters.length > 0" class="empty-state">
      <div class="icon">📊</div>
      <h3>还没有足够的数据生成时间轴</h3>
      <p>需要更长时间跨度的对话才能识别关系变化节点</p>
      <router-link to="/" class="btn btn-primary">返回首页</router-link>
    </div>

    <div v-else-if="store.timelines.length === 0" class="empty-state">
      <div class="icon">💌</div>
      <h3>还没有短信数据</h3>
      <p>先去首页上传短信备份，或者加载演示数据看看效果吧</p>
      <router-link to="/" class="btn btn-primary">去上传</router-link>
    </div>

    <div v-else class="timeline-content">
      <div class="conversation-selector">
        <span class="selector-label">选择对话：</span>
        <div class="conv-tabs">
          <button
            v-for="tl in store.timelines"
            :key="tl.conversationId"
            class="conv-tab"
            :class="{ active: selectedTimelineId === tl.conversationId }"
            @click="selectTimeline(tl)"
          >
            {{ tl.conversationName }}
            <span class="node-count">{{ tl.nodes.length }}个节点</span>
          </button>
        </div>
      </div>

      <div v-if="currentTimeline" class="timeline-container">
        <div class="timeline-stats">
          <div class="stat-item">
            <span class="stat-icon">🔥</span>
            <span class="stat-value">{{ warmingCount }}</span>
            <span class="stat-label">升温</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">❄️</span>
            <span class="stat-value">{{ coolingCount }}</span>
            <span class="stat-label">冷淡</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🌈</span>
            <span class="stat-value">{{ reconciliationCount }}</span>
            <span class="stat-label">和好</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📈</span>
            <span class="stat-value">{{ currentTimeline.periods.length }}</span>
            <span class="stat-label">时间段</span>
          </div>
        </div>

        <div class="timeline-chart">
          <svg class="chart-svg" :viewBox="chartViewBox" preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color: #ff6b6b; stop-opacity: 0.3" />
                <stop offset="100%" style="stop-color: #ff6b6b; stop-opacity: 0.05" />
              </linearGradient>
            </defs>
            
            <path :d="areaPath" fill="url(#areaGradient)" />
            
            <path :d="linePath" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            
            <g v-for="(period, idx) in currentTimeline.periods" :key="'dot-' + idx">
              <circle
                :cx="getPeriodX(idx)"
                :cy="getPeriodY(period)"
                r="4"
                fill="white"
                stroke="#ff6b6b"
                stroke-width="2"
              />
            </g>

            <g v-for="(node, idx) in currentTimeline.nodes" :key="'node-marker-' + idx">
              <line
                :x1="getNodeX(node)"
                :y1="0"
                :x2="getNodeX(node)"
                :y2="chartHeight"
                :stroke="getNodeColor(node.type)"
                stroke-width="2"
                stroke-dasharray="5,5"
                opacity="0.5"
              />
            </g>
          </svg>
        </div>

        <div class="timeline-nodes">
          <div class="timeline-line">
            <div class="line-track"></div>
          </div>
          
          <div 
            v-for="(node, idx) in currentTimeline.nodes" 
            :key="'node-' + idx"
            class="timeline-node"
            :class="[
              'node-' + node.type,
              { active: activeNodeIndex === idx }
            ]"
            :style="{ left: getNodePosition(node) + '%' }"
            @click="selectNode(node, idx)"
          >
            <div class="node-dot">
              <span class="node-icon">{{ node.icon }}</span>
            </div>
            <div class="node-content card">
              <div class="node-header">
                <span class="node-label">{{ node.label }}</span>
                <span class="node-date">{{ formatDate(node.date) }}</span>
              </div>
              <p class="node-desc">{{ node.description }}</p>
              <div class="node-preview" v-if="node.representativeMessage">
                <span class="preview-text">{{ truncateText(node.representativeMessage.body, 50) }}</span>
              </div>
              <button class="node-action btn btn-secondary" @click.stop="viewNodeMessages(node)">
                查看对话片段 →
              </button>
            </div>
          </div>
        </div>

        <div class="node-legend">
          <span class="legend-item">
            <span class="legend-dot warming"></span>
            升温
          </span>
          <span class="legend-item">
            <span class="legend-dot cooling"></span>
            冷淡
          </span>
          <span class="legend-item">
            <span class="legend-dot reconciliation"></span>
            和好
          </span>
        </div>
      </div>
    </div>

    <div v-if="showNodeModal && selectedNode" class="node-modal" @click.self="closeModal">
      <div class="modal-content card">
        <div class="modal-header">
          <div class="modal-title-section">
            <span class="modal-icon">{{ selectedNode.icon }}</span>
            <h3>{{ selectedNode.label }} - {{ formatDate(selectedNode.date) }}</h3>
          </div>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-desc">{{ selectedNode.description }}</p>

          <div class="period-info">
            <span class="info-item">
              <span class="info-label">时间段：</span>
              <span class="info-value">{{ formatDate(selectedNode.period.startDate) }} ~ {{ formatDate(selectedNode.period.endDate) }}</span>
            </span>
            <span class="info-item">
              <span class="info-label">消息数：</span>
              <span class="info-value">{{ selectedNode.messages.length }} 条</span>
            </span>
          </div>

          <h4 class="section-title">💬 当时的对话</h4>
          
          <div class="messages-list">
            <div 
              v-for="msg in displayMessages" 
              :key="msg.id"
              class="chat-message"
              :class="{ sent: msg.isSent, received: msg.isReceived }"
            >
              <div class="chat-avatar">
                {{ msg.isSent ? '👤' : '💑' }}
              </div>
              <div class="chat-content">
                <div class="chat-bubble">
                  {{ msg.body }}
                </div>
                <div class="chat-time">{{ formatDateTime(msg.date) }}</div>
              </div>
            </div>
          </div>

          <div v-if="selectedNode.messages.length > 10" class="show-more">
            <button class="btn btn-secondary" @click="showAllMessages = !showAllMessages">
              {{ showAllMessages ? '收起' : `展开全部 ${selectedNode.messages.length} 条消息` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { store } from '@/store'

const selectedTimelineId = ref(null)
const activeNodeIndex = ref(-1)
const showNodeModal = ref(false)
const selectedNode = ref(null)
const showAllMessages = ref(false)
const chartWidth = ref(800)
const chartHeight = ref(200)
const chartPadding = { top: 20, right: 20, bottom: 20, left: 20 }

const currentTimeline = computed(() => {
  if (!selectedTimelineId.value && store.timelines.length > 0) {
    selectedTimelineId.value = store.timelines[0].conversationId
  }
  return store.timelines.find(t => t.conversationId === selectedTimelineId.value)
})

const warmingCount = computed(() => {
  if (!currentTimeline.value) return 0
  return currentTimeline.value.nodes.filter(n => n.type === 'warming').length
})

const coolingCount = computed(() => {
  if (!currentTimeline.value) return 0
  return currentTimeline.value.nodes.filter(n => n.type === 'cooling').length
})

const reconciliationCount = computed(() => {
  if (!currentTimeline.value) return 0
  return currentTimeline.value.nodes.filter(n => n.type === 'reconciliation').length
})

const chartViewBox = computed(() => {
  return `0 0 ${chartWidth.value} ${chartHeight.value}`
})

const linePath = computed(() => {
  if (!currentTimeline.value || currentTimeline.value.periods.length === 0) return ''
  
  const periods = currentTimeline.value.periods
  const points = periods.map((p, i) => ({
    x: getPeriodX(i),
    y: getPeriodY(p)
  }))
  
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) / 3
    const cpy1 = prev.y
    const cpx2 = prev.x + (curr.x - prev.x) * 2 / 3
    const cpy2 = curr.y
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }
  
  return path
})

const areaPath = computed(() => {
  if (!currentTimeline.value || currentTimeline.value.periods.length === 0) return ''
  
  const periods = currentTimeline.value.periods
  const points = periods.map((p, i) => ({
    x: getPeriodX(i),
    y: getPeriodY(p)
  }))
  
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x} ${chartHeight.value - chartPadding.bottom}`
  path += ` L ${points[0].x} ${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) / 3
    const cpy1 = prev.y
    const cpx2 = prev.x + (curr.x - prev.x) * 2 / 3
    const cpy2 = curr.y
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }
  
  path += ` L ${points[points.length - 1].x} ${chartHeight.value - chartPadding.bottom}`
  path += ' Z'
  
  return path
})

const displayMessages = computed(() => {
  if (!selectedNode.value) return []
  if (showAllMessages.value) return selectedNode.value.messages
  return selectedNode.value.messages.slice(0, 10)
})

function selectTimeline(timeline) {
  selectedTimelineId.value = timeline.conversationId
  activeNodeIndex.value = -1
  store.setSelectedTimeline(timeline)
}

function selectNode(node, idx) {
  activeNodeIndex.value = idx
}

function viewNodeMessages(node) {
  selectedNode.value = node
  showNodeModal.value = true
  showAllMessages.value = false
  store.setSelectedTimelineNode(node)
}

function closeModal() {
  showNodeModal.value = false
  selectedNode.value = null
  showAllMessages.value = false
}

function getPeriodX(idx) {
  const periods = currentTimeline.value?.periods || []
  if (periods.length <= 1) return chartWidth.value / 2
  
  const usableWidth = chartWidth.value - chartPadding.left - chartPadding.right
  return chartPadding.left + (idx / (periods.length - 1)) * usableWidth
}

function getPeriodY(period) {
  const periods = currentTimeline.value?.periods || []
  if (periods.length === 0) return chartHeight.value / 2
  
  const scores = periods.map(p => p.totalScore)
  const minScore = Math.min(...scores, 0)
  const maxScore = Math.max(...scores, 1)
  const range = maxScore - minScore
  
  const usableHeight = chartHeight.value - chartPadding.top - chartPadding.bottom
  const normalizedScore = range > 0 ? (period.totalScore - minScore) / range : 0.5
  
  return chartPadding.top + (1 - normalizedScore) * usableHeight
}

function getNodeX(node) {
  const periods = currentTimeline.value?.periods || []
  if (periods.length === 0) return chartWidth.value / 2
  
  const totalDuration = periods[periods.length - 1].endDate - periods[0].startDate
  if (totalDuration === 0) return chartWidth.value / 2
  
  const position = (node.date - periods[0].startDate) / totalDuration
  const usableWidth = chartWidth.value - chartPadding.left - chartPadding.right
  
  return chartPadding.left + position * usableWidth
}

function getNodePosition(node) {
  const periods = currentTimeline.value?.periods || []
  if (periods.length === 0) return 50
  
  const totalDuration = periods[periods.length - 1].endDate - periods[0].startDate
  if (totalDuration === 0) return 50
  
  const position = (node.date - periods[0].startDate) / totalDuration
  return Math.max(5, Math.min(95, position * 100))
}

function getNodeColor(type) {
  switch (type) {
    case 'warming': return '#ff6b6b'
    case 'cooling': return '#4fc3f7'
    case 'reconciliation': return '#81c784'
    default: return '#999'
  }
}

function truncateText(text, maxLen) {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}年${month}月${day}日`
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

onMounted(() => {
  nextTick(() => {
    if (store.timelines.length > 0 && !selectedTimelineId.value) {
      selectedTimelineId.value = store.timelines[0].conversationId
    }
  })
})
</script>

<style scoped>
.timeline-page {
  max-width: 1200px;
  margin: 0 auto;
}

.timeline-header {
  text-align: center;
  margin-bottom: 2rem;
}

.timeline-header h2 {
  font-size: 2rem;
  color: var(--love-red);
  margin-bottom: 0.5rem;
}

.timeline-header p {
  color: var(--text-light);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-light);
}

.empty-state .icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: var(--text-dark);
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.timeline-content {
  position: relative;
}

.conversation-selector {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.selector-label {
  font-weight: 500;
  color: var(--text-dark);
}

.conv-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.conv-tab {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.conv-tab:hover {
  border-color: var(--love-pink);
}

.conv-tab.active {
  background: linear-gradient(135deg, var(--love-red), var(--love-pink));
  color: white;
  border-color: transparent;
}

.node-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.timeline-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.timeline-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--love-red);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-light);
}

.timeline-chart {
  margin-bottom: 2rem;
  background: var(--bg-light);
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

.chart-svg {
  width: 100%;
  min-height: 200px;
}

.timeline-nodes {
  position: relative;
  min-height: 300px;
  margin: 2rem 0;
}

.timeline-line {
  position: absolute;
  top: 30px;
  left: 5%;
  right: 5%;
  height: 4px;
}

.line-track {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--love-pink), var(--love-red), var(--love-pink));
  border-radius: 2px;
  opacity: 0.3;
}

.timeline-node {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 2;
  width: 180px;
}

.node-dot {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  border: 3px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: all 0.3s;
  box-shadow: var(--shadow);
}

.node-icon {
  font-size: 1.5rem;
}

.node-warming .node-dot {
  border-color: var(--love-red);
  background: #fff5f5;
}

.node-cooling .node-dot {
  border-color: #4fc3f7;
  background: #e1f5fe;
}

.node-reconciliation .node-dot {
  border-color: #81c784;
  background: #e8f5e9;
}

.timeline-node.active .node-dot,
.timeline-node:hover .node-dot {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
}

.node-content {
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s;
  pointer-events: none;
}

.timeline-node.active .node-content,
.timeline-node:hover .node-content {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.node-label {
  font-weight: bold;
  color: var(--text-dark);
}

.node-date {
  font-size: 0.75rem;
  color: var(--text-light);
}

.node-desc {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.node-preview {
  background: var(--bg-light);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.preview-text {
  font-size: 0.8rem;
  color: var(--text-dark);
}

.node-action {
  width: 100%;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
}

.node-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-light);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.warming {
  background: var(--love-red);
}

.legend-dot.cooling {
  background: #4fc3f7;
}

.legend-dot.reconciliation {
  background: #81c784;
}

.node-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  font-size: 1.5rem;
}

.modal-header h3 {
  color: var(--love-red);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-light);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--love-red);
  color: white;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
}

.modal-desc {
  color: var(--text-light);
  margin-bottom: 1rem;
}

.period-info {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-light);
  border-radius: 8px;
  flex-wrap: wrap;
}

.info-item {
  font-size: 0.9rem;
}

.info-label {
  color: var(--text-light);
}

.info-value {
  color: var(--text-dark);
  font-weight: 500;
}

.section-title {
  margin-bottom: 1rem;
  color: var(--text-dark);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-message {
  display: flex;
  gap: 0.75rem;
}

.chat-message.sent {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  background: var(--bg-medium);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.chat-content {
  max-width: 70%;
}

.chat-message.sent .chat-content {
  text-align: right;
}

.chat-bubble {
  display: inline-block;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  background: var(--bg-light);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.chat-message.sent .chat-bubble {
  background: linear-gradient(135deg, var(--love-red), var(--love-pink));
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message.received .chat-bubble {
  border-bottom-left-radius: 4px;
}

.chat-time {
  font-size: 0.75rem;
  color: var(--text-light);
}

.show-more {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

@media (max-width: 768px) {
  .timeline-stats {
    gap: 1rem;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .timeline-container {
    padding: 1rem;
  }
  
  .timeline-node {
    width: 140px;
  }
  
  .node-dot {
    width: 50px;
    height: 50px;
  }
  
  .node-icon {
    font-size: 1.2rem;
  }
  
  .node-content {
    font-size: 0.8rem;
  }
  
  .node-modal {
    padding: 1rem;
  }
  
  .modal-content {
    max-height: 90vh;
  }
}
</style>
