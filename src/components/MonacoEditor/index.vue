<script setup lang="ts">
import { editor } from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { useEditorTheme } from '@/editor/theme/editorTheme.ts'

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
const { resolvedTheme } = useEditorTheme()

let instance: editor.IStandaloneCodeEditor | undefined

function applyMonacoTheme() {
  const themeStyles = getComputedStyle(document.documentElement)
  const themeColor = (name: string) => themeStyles.getPropertyValue(name).trim()
  const themeName = `ai-design-${resolvedTheme.value}`

  editor.defineTheme(themeName, {
    base: resolvedTheme.value === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': themeColor('--surface-workbench'),
      'editor.foreground': themeColor('--text-primary'),
      'editorCursor.foreground': themeColor('--code-editor-cursor'),
      'editorLineNumber.foreground': themeColor('--text-muted'),
      'editorLineNumber.activeForeground': themeColor('--text-secondary'),
      'editor.lineHighlightBackground': themeColor('--surface-panel'),
      'editorIndentGuide.background1': themeColor('--border-color'),
      'editor.selectionBackground': themeColor('--code-editor-selection'),
      'editor.inactiveSelectionBackground': themeColor('--code-editor-selection-inactive'),
    },
  })

  editor.setTheme(themeName)
  return themeName
}

onMounted(() => {
  const themeName = applyMonacoTheme()

  instance = editor.create(editorElement.value, {
    value: modelValue.value,
    theme: themeName,
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
  if (!instance || newVal === instance.getValue()) return
  instance.setValue(newVal)
})

watch(resolvedTheme, applyMonacoTheme, { flush: 'post' })
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
