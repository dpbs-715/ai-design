import { createRouter, createWebHistory } from 'vue-router'
import ScreenEditor from '@/editor/index.vue'
import ScreenPreview from '@/pages/preview/index.vue'
import Screen from '@/pages/screen/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/editor',
    },
    {
      path: '/editor',
      component: ScreenEditor,
      name: 'ScreenEditor',
    },
    {
      path: '/preview',
      component: ScreenPreview,
      name: 'ScreenPreview',
    },
    {
      path: '/screen',
      component: Screen,
      name: 'Screen',
    },
  ],
})

export default router
