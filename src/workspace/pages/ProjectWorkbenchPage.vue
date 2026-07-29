<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import ProjectPageCard from '../components/ProjectPageCard.vue'
import PublicModuleCard from '../components/PublicModuleCard.vue'
import ModuleRemovalDialog from '../components/ModuleRemovalDialog.vue'
import WorkspaceTopbar from '../components/WorkspaceTopbar.vue'
import { useWorkspaceStore } from '../store.ts'
import type { ProjectPageRecord, PublicModuleRecord } from '../types.ts'

defineOptions({ name: 'ProjectWorkbench' })

type WorkbenchSection = 'pages' | 'modules' | 'data-sources' | 'assets' | 'settings'

interface WorkbenchNavItem {
  key: WorkbenchSection
  label: string
  icon: string
  description: string
}

const navigation: WorkbenchNavItem[] = [
  {
    key: 'pages',
    label: '页面',
    icon: 'fluent:window-multiple-20-regular',
    description: '管理完整画布与发布入口',
  },
  {
    key: 'modules',
    label: '公共模块',
    icon: 'fluent:puzzle-piece-20-regular',
    description: '管理可跨页面引用的局部设计',
  },
  {
    key: 'data-sources',
    label: '数据源',
    icon: 'fluent:database-20-regular',
    description: '项目级数据连接',
  },
  {
    key: 'assets',
    label: '素材',
    icon: 'fluent:image-multiple-20-regular',
    description: '项目图片与图形资产',
  },
  {
    key: 'settings',
    label: '项目设置',
    icon: 'fluent:settings-20-regular',
    description: '成员、发布和基础信息',
  },
]

const route = useRoute()
const router = useRouter()
const workspaceStore = useWorkspaceStore()

const projectId = computed(() => String(route.params.projectId ?? ''))
const project = computed(() => workspaceStore.getProject(projectId.value))
const projectPages = computed(() => workspaceStore.getProjectPages(projectId.value))
const projectModules = computed(() => workspaceStore.getProjectModules(projectId.value))
const moduleRemovalVisible = ref(false)
const moduleRemovalTarget = ref<PublicModuleRecord>()
const currentSection = computed<WorkbenchSection>(() => {
  const section = String(route.meta.workbenchSection ?? 'pages')
  return navigation.some((item) => item.key === section) ? (section as WorkbenchSection) : 'pages'
})
const currentNav = computed(() => navigation.find((item) => item.key === currentSection.value)!)

watch(
  projectId,
  (value) => {
    if (value) workspaceStore.recordProjectVisit(value)
  },
  { immediate: true },
)

function sectionPath(section: WorkbenchSection) {
  return `/projects/${projectId.value}/${section}`
}

function returnToPages() {
  void router.push(sectionPath('pages'))
}

async function promptForName(title: string, placeholder: string, initialValue = '') {
  try {
    const { value } = await ElMessageBox.prompt('', title, {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: initialValue,
      inputPlaceholder: placeholder,
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    return value.trim()
  } catch {
    return undefined
  }
}

async function createPage() {
  const name = await promptForName('新建页面', '例如：生产运营总览')
  if (!name) return
  const pageId = workspaceStore.addPage(projectId.value, name)
  if (!pageId) return
  await router.push(`/projects/${projectId.value}/pages/${pageId}/editor`)
}

async function createModule() {
  const name = await promptForName('新建公共模块', '例如：核心指标条')
  if (!name) return
  const moduleId = workspaceStore.addModule(projectId.value, name)
  if (!moduleId) return
  await router.push(`/projects/${projectId.value}/modules/${moduleId}/editor`)
}

async function renamePage(page: ProjectPageRecord) {
  const name = await promptForName('重命名页面', '页面名称', page.schema.root.name)
  if (name) workspaceStore.renamePage(page.id, name)
}

async function renameModule(publicModule: PublicModuleRecord) {
  const name = await promptForName('重命名公共模块', '模块名称', publicModule.schema.root.name)
  if (name) workspaceStore.renameModule(publicModule.id, name)
}

async function removePage(page: ProjectPageRecord) {
  try {
    await ElMessageBox.confirm(`删除后将无法在项目中打开“${page.schema.root.name}”。`, '删除页面', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    workspaceStore.removePage(page.id)
  } catch {
    // Cancelled destructive action.
  }
}

function removeModule(publicModule: PublicModuleRecord) {
  moduleRemovalTarget.value = publicModule
  moduleRemovalVisible.value = true
}

function showReferences(publicModule: PublicModuleRecord) {
  ElMessage.info(
    publicModule.referenceCount
      ? `${publicModule.schema.root.name} 被 ${publicModule.referenceCount} 个页面引用`
      : `${publicModule.schema.root.name} 暂无页面引用`,
  )
}
</script>

<template>
  <div v-if="project" class="workbench-shell">
    <WorkspaceTopbar>
      <div class="project-breadcrumb">
        <RouterLink to="/">主面板</RouterLink>
        <Icon icon="fluent:chevron-right-16-regular" width="13" />
        <strong>{{ project.name }}</strong>
        <span>{{ currentNav.label }}</span>
      </div>
    </WorkspaceTopbar>

    <div class="workbench-body">
      <aside class="project-sidebar">
        <div class="project-identity">
          <span class="project-monogram">{{ project.name.slice(0, 1) }}</span>
          <div>
            <strong>{{ project.name }}</strong>
            <small>{{ project.pageIds.length }} 页面 · {{ project.moduleIds.length }} 模块</small>
          </div>
        </div>

        <nav aria-label="项目导航">
          <RouterLink
            v-for="item in navigation"
            :key="item.key"
            :to="sectionPath(item.key)"
            :class="{ active: currentSection === item.key }"
          >
            <Icon :icon="item.icon" width="18" />
            <span>{{ item.label }}</span>
            <small v-if="item.key === 'pages'">{{ project.pageIds.length }}</small>
            <small v-else-if="item.key === 'modules'">{{ project.moduleIds.length }}</small>
          </RouterLink>
        </nav>

        <RouterLink class="back-dashboard" to="/">
          <Icon icon="fluent:arrow-left-20-regular" width="16" />
          返回主面板
        </RouterLink>
      </aside>

      <main class="workbench-main">
        <div class="workbench-content">
          <header class="workbench-heading">
            <div>
              <span class="heading-eyebrow">{{ currentSection.toUpperCase() }}</span>
              <h1>{{ currentNav.label }}</h1>
              <p>{{ currentNav.description }}</p>
            </div>
          </header>

          <template v-if="currentSection === 'pages'">
            <div v-if="projectPages.length" class="asset-grid">
              <button type="button" class="asset-create-card" @click="createPage">
                <Icon icon="fluent:add-square-multiple-20-regular" width="24" />
                <strong>新建页面</strong>
                <span>创建一张独立画布</span>
              </button>
              <ProjectPageCard
                v-for="page in projectPages"
                :key="page.id"
                :page="page"
                @rename="renamePage(page)"
                @duplicate="workspaceStore.duplicatePage(page.id)"
                @remove="removePage(page)"
              />
            </div>
            <div v-else class="large-empty-state">
              <span><Icon icon="fluent:window-new-20-regular" width="28" /></span>
              <h2>创建这个项目的第一张页面</h2>
              <p>页面可以独立编辑、预览与发布，也可以引用项目公共模块。</p>
              <CommonButton type="primary" @click="createPage">新建页面</CommonButton>
            </div>
          </template>

          <template v-else-if="currentSection === 'modules'">
            <div class="module-guidance">
              <Icon icon="fluent:puzzle-piece-20-regular" width="18" />
              <div>
                <strong>公共模块保持独立结构</strong>
                <span>页面引用模块版本并保存自己的实例参数，更新结构时不会覆盖绑定。</span>
              </div>
              <span class="skeleton-tag">版本骨架已启用</span>
            </div>

            <div v-if="projectModules.length" class="asset-grid">
              <button type="button" class="asset-create-card module-create" @click="createModule">
                <Icon icon="fluent:puzzle-piece-20-regular" width="24" />
                <strong>新建公共模块</strong>
                <span>复用一组稳定的局部设计</span>
              </button>
              <PublicModuleCard
                v-for="publicModule in projectModules"
                :key="publicModule.id"
                :public-module="publicModule"
                @rename="renameModule(publicModule)"
                @duplicate="workspaceStore.duplicateModule(publicModule.id)"
                @remove="removeModule(publicModule)"
                @references="showReferences(publicModule)"
              />
            </div>
            <div v-else class="large-empty-state">
              <span><Icon icon="fluent:puzzle-piece-20-regular" width="28" /></span>
              <h2>建立第一个可复用模块</h2>
              <p>模块会出现在页面 Editor 的“项目模块”分类中。</p>
              <CommonButton type="primary" @click="createModule">新建公共模块</CommonButton>
            </div>
          </template>

          <div v-else class="large-empty-state">
            <span><Icon :icon="currentNav.icon" width="28" /></span>
            <h2>{{ currentNav.label }}入口已保留</h2>
            <p>本阶段聚焦页面和公共模块，这里将承接后续的项目级能力。</p>
            <CommonButton type="normal" @click="returnToPages"> 返回页面管理 </CommonButton>
          </div>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="missing-project">
    <span><Icon icon="fluent:document-dismiss-20-regular" width="28" /></span>
    <h1>没有找到这个项目</h1>
    <RouterLink to="/">返回主面板</RouterLink>
  </div>

  <ModuleRemovalDialog
    v-model="moduleRemovalVisible"
    :public-module="moduleRemovalTarget"
    @removed="moduleRemovalTarget = undefined"
  />
</template>

<style scoped lang="scss">
.workbench-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
  background: var(--surface-workbench);
  color: var(--text-primary);
}

.project-breadcrumb {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 10px;

  a {
    color: var(--text-muted);
    text-decoration: none;

    &:hover {
      color: var(--text-primary);
    }
  }

  strong {
    overflow: hidden;
    color: var(--text-secondary);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > span {
    padding: 3px 7px;
    border-radius: 99px;
    background: var(--accent-soft);
    color: var(--accent-color);
  }
}

.workbench-body {
  display: flex;
  min-height: 0;
  flex: 1;
}

.project-sidebar {
  display: flex;
  width: 226px;
  min-width: 0;
  flex: none;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--border-color);
  background: var(--surface-panel);
}

.project-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 25px 18px 22px;
  border-bottom: 1px solid var(--border-color);

  > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 9px;
  }
}

.project-monogram {
  display: grid;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--accent-color) 26%, var(--border-color));
  border-radius: 9px;
  background: linear-gradient(145deg, var(--accent-soft), transparent), var(--surface-raised);
  color: var(--accent-color);
  font-size: 14px;
  font-weight: 700;
}

.project-sidebar nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 15px 10px;

  a {
    display: flex;
    height: 40px;
    align-items: center;
    gap: 10px;
    padding: 0 11px;
    border: 1px solid transparent;
    border-radius: 7px;
    color: var(--text-secondary);
    font-size: 11px;
    text-decoration: none;

    &:hover {
      background: var(--surface-raised);
      color: var(--text-primary);
    }

    &.active {
      border-color: color-mix(in srgb, var(--accent-color) 16%, var(--border-color));
      background: var(--accent-soft);
      color: var(--accent-color);
    }

    span {
      flex: 1;
    }

    small {
      font-size: 9px;
    }
  }
}

.back-dashboard {
  display: flex;
  height: 56px;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 10px;
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
  }
}

.workbench-main {
  min-width: 0;
  flex: 1;
  overflow-y: auto;
}

.workbench-content {
  width: min(1260px, 100%);
  margin: 0 auto;
  padding: 48px clamp(28px, 4vw, 64px) 70px;
}

.workbench-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border-color);

  h1 {
    margin: 7px 0 0;
    font-size: 28px;
    font-weight: 650;
    letter-spacing: -0.03em;
  }

  p {
    margin: 8px 0 0;
    color: var(--text-muted);
    font-size: 11px;
  }

  :deep(.CommonButton) {
    display: inline-flex;
    height: 34px;
    flex: none;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
  }
}

.heading-eyebrow {
  color: var(--accent-color);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(230px, 1fr));
  gap: 24px;
}

.asset-create-card {
  min-height: 286px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px dashed var(--border-color-strong);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-panel) 42%, transparent);
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    border-color: var(--accent-color);
    background: var(--accent-soft);
    color: var(--accent-color);
  }

  strong {
    margin-top: 12px;
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
  }

  span {
    margin-top: 6px;
    font-size: 9px;
  }
}

.module-create {
  border-style: dashed;
}

.module-guidance {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: -8px 0 24px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 18%, var(--border-color));
  border-radius: 9px;
  background: var(--accent-soft);
  color: var(--accent-color);

  > div {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  strong {
    color: var(--text-secondary);
    font-size: 10px;
    font-weight: 600;
  }

  div span {
    margin-top: 3px;
    color: var(--text-muted);
    font-size: 9px;
  }
}

.skeleton-tag {
  padding: 4px 7px;
  border: 1px solid color-mix(in srgb, var(--accent-color) 26%, transparent);
  border-radius: 99px;
  color: var(--accent-color);
  font-size: 8px;
  white-space: nowrap;
}

.large-empty-state,
.missing-project {
  display: flex;
  min-height: 420px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--text-muted);
  text-align: center;

  > span {
    display: grid;
    width: 58px;
    height: 58px;
    place-items: center;
    border: 1px solid var(--border-color);
    border-radius: 15px;
    background: var(--surface-panel);
    color: var(--accent-color);
  }

  h2,
  h1 {
    margin: 18px 0 0;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  p {
    max-width: 420px;
    margin: 8px 0 18px;
    font-size: 11px;
    line-height: 1.7;
  }
}

.missing-project {
  height: 100%;

  a {
    margin-top: 18px;
    color: var(--accent-color);
  }
}

@media (max-width: 1100px) {
  .asset-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 760px) {
  .project-sidebar {
    width: 62px;
  }

  .project-identity > div,
  .project-sidebar nav span,
  .project-sidebar nav small,
  .back-dashboard {
    display: none;
  }

  .project-identity {
    justify-content: center;
    padding: 20px 0;
  }

  .project-sidebar nav a {
    justify-content: center;
    padding: 0;
  }

  .workbench-content {
    padding: 32px 20px 54px;
  }

  .asset-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
