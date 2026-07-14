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

const editorElement = useTemplateRef('editorRef')

let instance

onMounted(() => {
  const themeStyles = getComputedStyle(document.documentElement)
  const themeColor = (name: string) => themeStyles.getPropertyValue(name).trim()

  editor.defineTheme('tungsten-workbench', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': themeColor('--surface-workbench'),
      'editor.foreground': themeColor('--text-primary'),
      'editorCursor.foreground': themeColor('--accent-color'),
      'editorLineNumber.foreground': themeColor('--text-muted'),
      'editorLineNumber.activeForeground': themeColor('--text-secondary'),
      'editor.lineHighlightBackground': themeColor('--surface-panel'),
      'editorIndentGuide.background1': themeColor('--border-color'),
      'editor.selectionBackground': '#7b8cff38',
      'editor.inactiveSelectionBackground': '#7b8cff24',
    },
  })

  instance = editor.create(editorElement.value, {
    value: modelValue.value,
    theme: 'tungsten-workbench',
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

watch(modelValue, (newVal) => {
  if (newVal === instance.getValue()) return
  instance.setValue(newVal)
})
</script>

<template>
  <div class="editor-container" ref="editorRef"></div>
</template>

<style scoped lang="scss">
.editor-container {
  height: 100%;
  min-height: 300px;
  width: 100%;
}
</style>
