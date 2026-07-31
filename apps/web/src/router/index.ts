import { createRouter, createWebHistory } from 'vue-router'
import AuthLayout from '@/auth/AuthLayout.vue'
import LoginPage from '@/auth/pages/LoginPage.vue'
import RegisterPage from '@/auth/pages/RegisterPage.vue'
import { useAuthStore } from '@/auth/store.ts'
import ScreenEditor from '@/editor/index.vue'
import ScreenPreview from '@/pages/preview/index.vue'
import Screen from '@/pages/screen/index.vue'
import DashboardPage from '@/workspace/pages/DashboardPage.vue'
import ProjectWorkbenchPage from '@/workspace/pages/ProjectWorkbenchPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: AuthLayout,
      redirect: { name: 'Login' },
      children: [
        {
          path: '/login',
          component: LoginPage,
          name: 'Login',
          meta: { guestOnly: true },
        },
        {
          path: '/register',
          component: RegisterPage,
          name: 'Register',
          meta: { guestOnly: true },
        },
      ],
    },
    {
      path: '/',
      component: DashboardPage,
      name: 'Dashboard',
      meta: { requiresAuth: true },
    },
    {
      path: '/editor',
      component: ScreenEditor,
      name: 'ScreenEditor',
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:projectId/pages',
      component: ProjectWorkbenchPage,
      name: 'ProjectPages',
      meta: { requiresAuth: true, workbenchSection: 'pages' },
    },
    {
      path: '/projects/:projectId/modules',
      component: ProjectWorkbenchPage,
      name: 'ProjectModules',
      meta: { requiresAuth: true, workbenchSection: 'modules' },
    },
    {
      path: '/projects/:projectId/data-sources',
      component: ProjectWorkbenchPage,
      name: 'ProjectDataSources',
      meta: { requiresAuth: true, workbenchSection: 'data-sources' },
    },
    {
      path: '/projects/:projectId/assets',
      component: ProjectWorkbenchPage,
      name: 'ProjectAssets',
      meta: { requiresAuth: true, workbenchSection: 'assets' },
    },
    {
      path: '/projects/:projectId/settings',
      component: ProjectWorkbenchPage,
      name: 'ProjectSettings',
      meta: { requiresAuth: true, workbenchSection: 'settings' },
    },
    {
      path: '/projects/:projectId/pages/:pageId/editor',
      component: ScreenEditor,
      name: 'ProjectPageEditor',
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:projectId/modules/:moduleId/editor',
      component: ScreenEditor,
      name: 'ProjectModuleEditor',
      meta: { requiresAuth: true },
    },
    {
      path: '/preview',
      component: ScreenPreview,
      name: 'ScreenPreview',
      meta: { requiresAuth: true },
    },
    {
      path: '/screen',
      component: Screen,
      name: 'Screen',
    },
  ],
})

router.beforeEach(async (to) => {
  const requiresAuthentication = to.matched.some((record) => record.meta.requiresAuth)
  const isGuestOnly = to.matched.some((record) => record.meta.guestOnly)
  if (!requiresAuthentication && !isGuestOnly) return true

  const authStore = useAuthStore()
  if (
    authStore.status === 'unknown' ||
    (requiresAuthentication && authStore.status === 'unavailable')
  ) {
    await authStore.initialize()
  }

  if (requiresAuthentication && authStore.status !== 'authenticated') {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    }
  }

  if (isGuestOnly && authStore.status === 'authenticated') {
    return { name: 'Dashboard' }
  }

  return true
})

export default router
