import { reactive } from 'vue'
import { getAllTimelines } from '@/detectors'

export const store = reactive({
  conversations: [],
  selectedConversation: null,
  loveLetters: [],
  anonymousPosts: [],
  processing: false,
  error: null,
  timelines: [],
  selectedTimeline: null,
  selectedTimelineNode: null,
  highlightMessageId: null,
  scrollToMessageId: null,

  setConversations(convs) {
    this.conversations = convs
  },

  setLoveLetters(letters) {
    this.loveLetters = letters
    this.timelines = getAllTimelines(letters)
  },

  setSelectedConversation(conv) {
    this.selectedConversation = conv
  },

  addAnonymousPost(post) {
    this.anonymousPosts.unshift(post)
  },

  setProcessing(val) {
    this.processing = val
  },

  setError(err) {
    this.error = err
  },

  setSelectedTimeline(timeline) {
    this.selectedTimeline = timeline
  },

  setSelectedTimelineNode(node) {
    this.selectedTimelineNode = node
  },

  setHighlightMessageId(msgId) {
    this.highlightMessageId = msgId
  },

  setScrollToMessageId(msgId) {
    this.scrollToMessageId = msgId
  },

  clearAll() {
    this.conversations = []
    this.selectedConversation = null
    this.loveLetters = []
    this.error = null
    this.timelines = []
    this.selectedTimeline = null
    this.selectedTimelineNode = null
    this.highlightMessageId = null
    this.scrollToMessageId = null
  }
})
