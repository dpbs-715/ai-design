import { createRouter, createWebHistory } from 'vue-router'
import { setUnauthorizedHandler } from '@/api/client.ts'
import { useAuthStore } from '@/auth/store.ts'
import { useWorkspaceStore } from '@/workspace/store.ts'
import {
  beginRouteNavigation,
  failRouteNavigation,
  finishRouteNavigation,
} from './navigationState.ts'

const AuthLayout = () => import('@/auth/AuthLayout.vue')
const LoginPage = () => import('@/auth/pages/LoginPage.vue')
const RegisterPage = () => import('@/auth/pages/RegisterPage.vue')
const DashboardPage = () => import('@/workspace/pages/DashboardPage.vue')
const ProjectWorkbenchPage = () => import('@/workspace/pages/ProjectWorkbenchPage.vue')
const ScreenEditor = () => import('@/editor/index.vue')
const Screen = () => import('@/pages/screen/index.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: AuthLayout,
      redirect: { name: 'Login' },
      meta: { usesAuthPanelTransition: true },
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
      component: Screen,
      name: 'ScreenPreview',
      meta: { requiresAuth: true },
    },
    {
      path: '/screen',
      component: Screen,
      name: 'Screen',
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from) => {
  if (to.meta.usesAuthPanelTransition && from.meta.usesAuthPanelTransition) return
  beginRouteNavigation(to)
})

router.afterEach((to) => {
  finishRouteNavigation(to)
})

router.onError((error, to) => {
  console.error('Route navigation failed', error)
  failRouteNavigation(to)
})

setUnauthorizedHandler(() => {
  const authStore = useAuthStore()
  authStore.clearSession()
  const currentRoute = router.currentRoute.value
  if (currentRoute.matched.some((record) => record.meta.requiresAuth)) {
    void router.push({ name: 'Login', query: { redirect: currentRoute.fullPath } })
  }
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

  if (requiresAuthentication && authStore.user) {
    const workspaceStore = useWorkspaceStore()
    try {
      await workspaceStore.initialize(authStore.user.id)
    } catch {
      if (to.name !== 'Dashboard') return { name: 'Dashboard' }
    }
  }

  if (isGuestOnly && authStore.status === 'authenticated') {
    return { name: 'Dashboard' }
  }

  return true
})

export default router
