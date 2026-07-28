<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import ProjectStackCard from '../components/ProjectStackCard.vue'
import SystemSidebar from '../components/SystemSidebar.vue'
import WorkspaceTopbar from '../components/WorkspaceTopbar.vue'
import { useWorkspaceStore } from '../store.ts'
import { compareWorkspaceTimeDescending } from '../time.ts'
import { useWorkspaceResponsive } from '../useWorkspaceResponsive.ts'
import type { DesignProject } from '../types.ts'

defineOptions({ name: 'WorkspaceDashboard' })

const workspaceStore = useWorkspaceStore()
const { systems, projects, selectedSystemId } = storeToRefs(workspaceStore)
const sidebarCollapsed = ref(false)
const drawerOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const dashboardMode = ref<'all' | 'recent' | 'favorites'>('all')
const { isCompact, isMobile } = useWorkspaceResponsive()

const sidebarCollapsedModel = computed({
  get: () => (isMobile.value ? false : sidebarCollapsed.value),
  set: (value) => {
    sidebarCollapsed.value = value
  },
})
const selectedSystemModel = computed({
  get: () => selectedSystemId.value,
  set: (value) => workspaceStore.selectSystem(value),
})

const selectedSystem = computed(() =>
  systems.value.find((system) => system.id === selectedSystemId.value),
)
const visibleProjects = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return projects.value
    .filter((project) => project.systemId === selectedSystemId.value)
    .filter((project) => {
      if (dashboardMode.value === 'recent' && !project.lastOpenedAt) return false
      if (dashboardMode.value === 'favorites' && !project.isFavorite) return false
      return (
        !query ||
        project.name.toLocaleLowerCase().includes(query) ||
        project.description.toLocaleLowerCase().includes(query)
      )
    })
    .sort((left, right) =>
      dashboardMode.value === 'recent'
        ? compareWorkspaceTimeDescending(left.lastOpenedAt, right.lastOpenedAt)
        : compareWorkspaceTimeDescending(left.updatedAt, right.updatedAt),
    )
})

const modeLabel = computed(() => {
  if (dashboardMode.value === 'recent') return '最近访问'
  if (dashboardMode.value === 'favorites') return '收藏项目'
  return '全部项目'
})

watch([isCompact, isMobile], ([compact, mobile]) => {
  if (compact && !mobile) sidebarCollapsed.value = true
  if (!mobile) drawerOpen.value = false
})

async function createProject() {
  try {
    const { value } = await ElMessageBox.prompt('项目将创建在当前业务系统中。', '新建设计项目', {
      confirmButtonText: '创建项目',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：二号工厂指挥中心',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入项目名称',
    })
    workspaceStore.addProject(value.trim())
  } catch {
    // Closing the prompt keeps the current dashboard state unchanged.
  }
}

async function renameProject(project: DesignProject) {
  try {
    const { value } = await ElMessageBox.prompt('', '重命名项目', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: project.name,
      inputPattern: /\S+/,
      inputErrorMessage: '项目名称不能为空',
    })
    workspaceStore.renameProject(project.id, value.trim())
  } catch {
    // Cancelling leaves the project unchanged.
  }
}

function duplicateProject(project: DesignProject) {
  workspaceStore.duplicateProject(project.id)
  ElMessage.success(`已复制“${project.name}”`)
}

async function removeProject(project: DesignProject) {
  try {
    await ElMessageBox.confirm(
      `将同时删除项目内的 ${project.pageIds.length} 个页面和 ${project.moduleIds.length} 个公共模块。`,
      `删除“${project.name}”`,
      {
        type: 'warning',
        confirmButtonText: '删除项目',
        cancelButtonText: '取消',
      },
    )
    workspaceStore.removeProject(project.id)
  } catch {
    // Cancelled destructive action.
  }
}

function changeMode(mode: typeof dashboardMode.value) {
  dashboardMode.value = mode
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) searchQuery.value = ''
}
</script>

<template>
  <div class="dashboard-shell">
    <WorkspaceTopbar>
      <div class="topbar-note">
        <button
          v-if="isMobile"
          type="button"
          class="mobile-system-trigger"
          aria-label="打开业务系统"
          @click="drawerOpen = true"
        >
          <Icon icon="fluent:navigation-20-regular" width="18" />
        </button>
        <span>设计工作区</span>
        <i></i>
        <strong>{{ selectedSystem?.name }}</strong>
      </div>
    </WorkspaceTopbar>

    <div class="dashboard-body">
      <button
        v-if="isMobile && drawerOpen"
        type="button"
        class="drawer-backdrop"
        aria-label="关闭业务系统"
        @click="drawerOpen = false"
      ></button>
      <SystemSidebar
        v-model:collapsed="sidebarCollapsedModel"
        v-model:selected-system-id="selectedSystemModel"
        :systems="systems"
        :drawer="isMobile"
        :open="drawerOpen"
        @close="drawerOpen = false"
      />

      <main class="dashboard-main">
        <section class="dashboard-content">
          <header class="page-intro">
            <div>
              <span class="intro-eyebrow">PROJECT ARCHIVE</span>
              <h1>{{ selectedSystem?.name }}</h1>
              <p>
                {{ selectedSystem?.description }}。选择一个项目进入工作台，或从一张空白画布开始。
              </p>
            </div>
            <CommonButton type="primary" @click="createProject">
              <Icon icon="fluent:add-20-regular" width="16" />
              新建项目
            </CommonButton>
          </header>

          <div v-if="searchOpen" class="dashboard-search">
            <Icon icon="fluent:search-20-regular" width="17" />
            <el-input
              v-model="searchQuery"
              autofocus
              clearable
              placeholder="搜索当前业务系统中的项目"
              aria-label="搜索项目"
            />
            <span>{{ visibleProjects.length }} 个结果</span>
          </div>

          <div class="project-count">
            <span>{{ visibleProjects.length }} 个项目</span>
            <i></i>
            <span>{{ modeLabel }}</span>
            <i></i>
            <span>{{ dashboardMode === 'recent' ? '最近访问优先' : '最近更新优先' }}</span>
          </div>

          <div class="project-grid">
            <ProjectStackCard
              v-for="project in visibleProjects"
              :key="project.id"
              :project="project"
              @open="workspaceStore.recordProjectVisit(project.id)"
              @rename="renameProject(project)"
              @duplicate="duplicateProject(project)"
              @remove="removeProject(project)"
              @toggle-favorite="workspaceStore.toggleProjectFavorite(project.id)"
            />

            <button
              v-if="dashboardMode === 'all' && !searchQuery"
              type="button"
              class="new-project-card"
              @click="createProject"
            >
              <span class="new-stack">
                <i></i>
                <i></i>
                <span>
                  <b><Icon icon="fluent:add-28-regular" width="28" /></b>
                </span>
              </span>
              <span class="new-project-info">
                <strong>新建设计项目</strong>
                <span>创建页面与公共模块</span>
                <small>从空白项目开始</small>
                <b>
                  开始创建
                  <Icon icon="fluent:arrow-right-20-regular" width="15" />
                </b>
              </span>
            </button>
          </div>

          <div
            v-if="!visibleProjects.length && (dashboardMode !== 'all' || searchQuery)"
            class="dashboard-empty"
          >
            <span>
              <Icon
                :icon="
                  dashboardMode === 'favorites'
                    ? 'fluent:star-off-20-regular'
                    : dashboardMode === 'recent'
                      ? 'fluent:clock-dismiss-20-regular'
                      : 'fluent:search-info-20-regular'
                "
                width="25"
              />
            </span>
            <strong>暂时没有匹配的项目</strong>
            <p>可以切换筛选条件，或清除搜索关键词后再试。</p>
          </div>
        </section>

        <nav class="floating-dock" aria-label="工作区快捷入口">
          <button
            type="button"
            :class="{ active: dashboardMode === 'all' }"
            @click="changeMode('all')"
          >
            <Icon icon="fluent:grid-20-filled" width="18" />
            <span>项目</span>
          </button>
          <button
            type="button"
            :class="{ active: dashboardMode === 'recent' }"
            @click="changeMode('recent')"
          >
            <Icon icon="fluent:clock-20-regular" width="18" />
            <span>最近</span>
          </button>
          <button
            type="button"
            :class="{ active: dashboardMode === 'favorites' }"
            @click="changeMode('favorites')"
          >
            <Icon icon="fluent:star-20-regular" width="18" />
            <span>收藏</span>
          </button>
          <i></i>
          <button type="button" :class="{ active: searchOpen }" @click="toggleSearch">
            <Icon icon="fluent:search-20-regular" width="18" />
            <span>搜索</span>
          </button>
        </nav>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
  background:
    radial-gradient(circle at 72% 12%, var(--accent-soft), transparent 28%),
    var(--surface-workbench);
  color: var(--text-primary);
}

.topbar-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--text-muted);
  font-size: 11px;

  i {
    width: 16px;
    height: 1px;
    background: var(--border-color-strong);
  }

  strong {
    color: var(--text-secondary);
    font-weight: 600;
  }
}

.mobile-system-trigger {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-raised);
  color: var(--text-secondary);
  margin-left: 8px;
}

.dashboard-body {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
}

.drawer-backdrop {
  position: fixed;
  z-index: 17;
  inset: 68px 0 0;
  padding: 0;
  border: 0;
  background: rgb(4 8 12 / 48%);
  backdrop-filter: blur(2px);
}

.dashboard-main {
  position: relative;
  min-width: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dashboard-content {
  width: min(1440px, 100%);
  min-height: 100%;
  margin: 0 auto;
  padding: 54px clamp(28px, 4vw, 70px) 128px;
}

.page-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 34px;
  border-bottom: 1px solid var(--border-color);

  h1 {
    margin: 8px 0 0;
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 650;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 620px;
    margin: 12px 0 0;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.7;
  }

  :deep(.CommonButton) {
    display: inline-flex;
    height: 36px;
    flex: none;
    align-items: center;
    gap: 7px;
    padding: 0 15px;
  }
}

.intro-eyebrow {
  color: var(--accent-color);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.project-count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 25px 0 8px;
  color: var(--text-muted);
  font-size: 10px;

  i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--border-color-strong);
  }
}

.dashboard-search {
  display: grid;
  max-width: 620px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 22px 0 0;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 24%, var(--border-color));
  border-radius: 11px;
  background: color-mix(in srgb, var(--surface-panel) 82%, transparent);
  color: var(--text-muted);
  box-shadow: 0 10px 30px rgb(0 0 0 / 6%);

  :deep(.el-input__wrapper) {
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  > span {
    font-size: 10px;
    white-space: nowrap;
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 46px clamp(30px, 3.2vw, 52px);
}

.new-project-card {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  text-align: left;
  cursor: pointer;
}

.new-stack {
  position: relative;
  display: block;
  width: calc(100% - 20px);
  aspect-ratio: 1.48;
  margin: 14px 10px 24px;

  > i {
    position: absolute;
    inset: 4px;
    border: 1px dashed color-mix(in srgb, var(--border-color-strong) 70%, transparent);
    border-radius: 14px;
    transform: rotate(-2.8deg);
  }

  > i:nth-child(2) {
    transform: rotate(2.5deg);
  }

  > span {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border: 1px dashed var(--border-color-strong);
    border-radius: 14px;
    background: color-mix(in srgb, var(--surface-panel) 48%, transparent);
    transition:
      border-color 160ms ease,
      background-color 160ms ease,
      transform 160ms ease;
  }

  b {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    background: var(--surface-panel);
    color: var(--text-secondary);
  }
}

.new-project-card:hover .new-stack > span {
  border-color: var(--accent-color);
  background: var(--accent-soft);
  transform: translateY(-5px);
}

.dashboard-empty {
  display: flex;
  min-height: 280px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--text-muted);
  text-align: center;

  > span {
    display: grid;
    width: 52px;
    height: 52px;
    place-items: center;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    background: var(--surface-panel);
    color: var(--accent-color);
  }

  strong {
    margin-top: 16px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  p {
    margin: 7px 0 0;
    font-size: 11px;
  }
}

.new-project-info {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  padding: 0 5px;

  strong {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  > span {
    margin-top: 6px;
    overflow: hidden;
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.55;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 10px;
    color: var(--text-muted);
    font-size: 10px;
  }

  b {
    display: inline-flex;
    height: 30px;
    align-items: center;
    gap: 5px;
    margin-top: 15px;
    color: var(--accent-color);
    font-size: 11px;
    font-weight: 550;
  }
}

.floating-dock {
  position: sticky;
  z-index: 10;
  bottom: 18px;
  display: flex;
  width: fit-content;
  height: 48px;
  align-items: center;
  gap: 3px;
  margin: -80px auto 20px;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--border-color-strong) 74%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-panel) 72%, transparent);
  box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
  backdrop-filter: blur(22px) saturate(1.3);

  a,
  button {
    display: inline-flex;
    height: 36px;
    align-items: center;
    gap: 6px;
    padding: 0 11px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--text-muted);
    font-size: 10px;
    text-decoration: none;
    cursor: pointer;

    &:hover,
    &.active {
      background: var(--surface-raised);
      color: var(--text-primary);
    }

    &.active {
      color: var(--accent-color);
    }
  }

  > i {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--border-color);
  }
}

@media (max-width: 1280px) {
  .project-grid {
    grid-template-columns: repeat(3, minmax(220px, 1fr));
  }
}

@media (max-width: 980px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(210px, 1fr));
  }
}

@media (max-width: 640px) {
  .dashboard-content {
    padding: 34px 20px 120px;
  }

  .page-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar-note {
    justify-content: flex-start;

    > span,
    > i {
      display: none;
    }
  }

  .project-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .floating-dock span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .new-stack > span {
    transition: none;
  }
}
</style>
