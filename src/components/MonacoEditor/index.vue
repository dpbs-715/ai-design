<script setup lang="ts">
import { editor } from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

defineOptions({ name: 'MonacoEditor' })

window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new JsonWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new EditorWorker()
  },
}

const props = defineProps<{ lang?: string }>()

const modelValue = defineModel<string>()

const editorElement = useTemplateRef('editor')

onMounted(() => {
  const instance = editor.create(editorElement.value, {
    value: modelValue.value,
    theme: 'vs-dark',
    language: props.lang || 'json',
    fontSize: 14,
    tabSize: 2,
    automaticLayout: true,
  })

  instance.onDidChangeModelContent(() => {
    modelValue.value = instance.getValue()
  })

  onBeforeUnmount(() => {
    instance.dispose()
  })
})
</script>

<template>
  <div class="editor-container" ref="editor"></div>
</template>

<style scoped lang="scss">
.editor-container {
  height: 100%;
  min-height: 400px;
  width: 100%;
}
</style>
