<script setup lang="ts">
import { getStageLabel, type AgentTurn } from '@/stores/agentChat.ts'

defineOptions({ name: 'AgentTurnItem' })

const { turn } = defineProps<{ turn: AgentTurn }>()

const reply = computed(() => (turn.role === 'agent' ? turn : undefined))
/** 只展示最后一个阶段 —— 中间阶段的历史对用户没有价值,占地方。 */
const currentStage = computed(() => reply.value?.stages.at(-1))
const errors = computed(() => reply.value?.errors ?? [])
</script>

<template>
  <div v-if="turn.role === 'user'" class="turn turn-user">
    <p>{{ turn.text }}</p>
  </div>

  <div v-else class="turn turn-agent">
    <div v-if="turn.status === 'streaming'" class="stage">
      <Icon icon="fluent:spinner-ios-20-regular" class="spin" width="13" />
      <span>{{ currentStage ? getStageLabel(currentStage) : '正在连接' }}</span>
    </div>

    <template v-else-if="turn.status === 'succeeded'">
      <p class="summary">{{ turn.summary }}</p>
      <div class="meta">
        <Icon icon="fluent:checkmark-circle-20-filled" width="13" />
        <span>已应用 {{ turn.operationCount }} 项修改，可按 Ctrl+Z 撤销</span>
      </div>
    </template>

    <template v-else-if="turn.status === 'aborted'">
      <div class="meta muted">
        <Icon icon="fluent:dismiss-circle-20-regular" width="13" />
        <span>已取消</span>
      </div>
    </template>

    <template v-else>
      <p v-if="turn.summary" class="summary">{{ turn.summary }}</p>
      <div class="meta failed">
        <Icon icon="fluent:warning-20-filled" width="13" />
        <span>{{ turn.message ?? '这次没能完成修改' }}</span>
      </div>
      <ul v-if="errors.length" class="errors">
        <li v-for="(error, index) in errors" :key="index">
          <template v-if="error.kind === 'operation'">
            第 {{ error.index + 1 }} 项（{{ error.operationType }}）：{{ error.message }}
          </template>
          <template v-else>{{ error.message }}</template>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped lang="scss">
.turn {
  font-size: 12px;
  line-height: 1.6;

  p {
    margin: 0;
  }
}

.turn-user {
  align-self: flex-end;
  max-width: 88%;
  padding: 7px 10px;
  border-radius: 10px 10px 2px 10px;
  background: var(--accent-soft);
  color: var(--accent-color);
  white-space: pre-wrap;
  word-break: break-word;
}

.turn-agent {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
}

.summary {
  color: var(--text-primary);
  word-break: break-word;
}

.stage,
.meta {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 11px;
}

.meta svg {
  flex: none;
  color: var(--el-color-success);
}

.meta.failed svg {
  color: var(--el-color-warning);
}

.meta.muted svg {
  color: var(--text-muted);
}

.errors {
  margin: 0;
  padding-left: 16px;
  color: var(--el-color-warning);
  font-size: 11px;

  li + li {
    margin-top: 3px;
  }
}

.spin {
  flex: none;
  animation: turn-spin 1s linear infinite;
}

@keyframes turn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
