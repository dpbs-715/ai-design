<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import { useAgentChatStore } from '@/stores/agentChat.ts'
import AgentTurnItem from './components/AgentTurnItem.vue'

defineOptions({ name: 'AgentPanel' })

const route = useRoute()
const agentChatStore = useAgentChatStore()
const { turns, streaming, canSend } = storeToRefs(agentChatStore)

const projectId = computed(() => String(route.params.projectId ?? ''))
const draft = ref('')
const scrollRef = useTemplateRef<HTMLElement>('scroll')

async function submit() {
  const text = draft.value
  if (!text.trim() || !canSend.value) return
  draft.value = ''
  await agentChatStore.send(projectId.value, text)
}

/** Enter 发送,Shift+Enter 换行。 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  void submit()
}

// 新消息进来时滚到底。turns 是深层可变的,阶段更新也要跟着滚。
watch(
  () => turns.value.map((turn) => (turn.role === 'agent' ? turn.stages.length : 0)).join(),
  async () => {
    await nextTick()
    const element = scrollRef.value
    if (element) element.scrollTop = element.scrollHeight
  },
)
</script>

<template>
  <div class="agent-panel flex flex-col">
    <header class="agent-header flex items-center justify-between">
      <span class="title">
        <Icon icon="fluent:sparkle-20-filled" width="13" />
        AI 设计
      </span>
      <button
        v-if="turns.length"
        class="reset"
        type="button"
        title="清空会话"
        @click="agentChatStore.reset()"
      >
        <Icon icon="fluent:arrow-clockwise-20-regular" width="14" />
      </button>
    </header>

    <div ref="scroll" class="agent-turns flex flex-col overflow-auto">
      <p v-if="!turns.length" class="empty">
        描述你想要的页面效果，比如「在顶部加一个标题，写销售概览」。
      </p>
      <AgentTurnItem v-for="turn in turns" :key="turn.id" :turn="turn" />
    </div>

    <footer class="agent-composer">
      <textarea
        v-model="draft"
        class="composer-input"
        rows="3"
        placeholder="描述你想要的修改，Enter 发送"
        :disabled="streaming"
        @keydown="onKeydown"
      />
      <div class="composer-actions flex items-center justify-between">
        <small>Shift+Enter 换行</small>
        <CommonButton v-if="streaming" size="small" @click="agentChatStore.cancel()">
          停止
        </CommonButton>
        <CommonButton
          v-else
          type="primary"
          size="small"
          :disabled="!draft.trim()"
          @click="submit()"
        >
          发送
        </CommonButton>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.agent-panel {
  width: 300px;
  height: 100%;
  box-sizing: border-box;
  background: var(--surface-panel);
}

.agent-header {
  height: 34px;
  flex: none;
  padding: 0 10px;
  border-bottom: 1px solid var(--border-color);

  .title {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;

    svg {
      color: var(--accent-color);
    }
  }

  .reset {
    display: flex;
    padding: 3px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;

    &:hover {
      background: var(--surface-hover);
      color: var(--text-secondary);
    }
  }
}

.agent-turns {
  flex: 1;
  gap: 12px;
  padding: 12px 10px;
  min-height: 0;
}

.empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.7;
}

.agent-composer {
  flex: none;
  padding: 8px 10px 10px;
  border-top: 1px solid var(--border-color);
}

.composer-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface-raised);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.6;
  resize: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }

  &:disabled {
    color: var(--text-muted);
    cursor: not-allowed;
  }
}

.composer-actions {
  margin-top: 7px;

  small {
    color: var(--text-muted);
    font-size: 10px;
  }
}
</style>
