import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Wall from '@/views/Wall.vue'
import Gallery from '@/views/Gallery.vue'
import Guess from '@/views/Guess.vue'
import Timeline from '@/views/Timeline.vue'

const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/wall', component: Wall, name: 'wall' },
  { path: '/gallery', component: Gallery, name: 'gallery' },
  { path: '/guess/:id', component: Guess, name: 'guess' },
  { path: '/timeline', component: Timeline, name: 'timeline' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
