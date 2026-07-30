import { createRouter, createWebHistory } from 'vue-router'
import ScreenEditor from '@/editor/index.vue'
import ScreenPreview from '@/pages/preview/index.vue'
import Screen from '@/pages/screen/index.vue'
import DashboardPage from '@/workspace/pages/DashboardPage.vue'
import ProjectWorkbenchPage from '@/workspace/pages/ProjectWorkbenchPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DashboardPage,
      name: 'Dashboard',
    },
    {
      path: '/editor',
      component: ScreenEditor,
      name: 'ScreenEditor',
    },
    {
      path: '/projects/:projectId/pages',
      component: ProjectWorkbenchPage,
      name: 'ProjectPages',
      meta: { workbenchSection: 'pages' },
    },
    {
      path: '/projects/:projectId/modules',
      component: ProjectWorkbenchPage,
      name: 'ProjectModules',
      meta: { workbenchSection: 'modules' },
    },
    {
      path: '/projects/:projectId/data-sources',
      component: ProjectWorkbenchPage,
      name: 'ProjectDataSources',
      meta: { workbenchSection: 'data-sources' },
    },
    {
      path: '/projects/:projectId/assets',
      component: ProjectWorkbenchPage,
      name: 'ProjectAssets',
      meta: { workbenchSection: 'assets' },
    },
    {
      path: '/projects/:projectId/settings',
      component: ProjectWorkbenchPage,
      name: 'ProjectSettings',
      meta: { workbenchSection: 'settings' },
    },
    {
      path: '/projects/:projectId/pages/:pageId/editor',
      component: ScreenEditor,
      name: 'ProjectPageEditor',
    },
    {
      path: '/projects/:projectId/modules/:moduleId/editor',
      component: ScreenEditor,
      name: 'ProjectModuleEditor',
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
