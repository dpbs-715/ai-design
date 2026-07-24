import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Icon } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
import { registerComponent, registerComponentDefaultPropsMap } from '@vunio/ui'
import { ElInputNumber, ElSwitch } from 'element-plus'
import '@/mock/data.ts'
import { initializeEditorTheme } from '@/editor/theme/editorTheme.ts'
import ThemeColorPicker from '@/components/ThemeColorPicker/index.vue'
import JsonValueSetter from '@/materials/business-form/setters/JsonValueSetter.vue'
import FormRulesSetter from '@/materials/business-form/setters/FormRulesSetter.vue'

initializeEditorTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)

registerComponent({
  number: (props, { slots }) => h(ElInputNumber, { precision: 3, ...props }, slots),
  switch: ElSwitch,
  themeColor: ThemeColorPicker,
  jsonValue: JsonValueSetter,
  formRules: FormRulesSetter,
})
registerComponentDefaultPropsMap({
  CommonForm: {
    size: 'small',
    col: {
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },
  },
  CommonDialog: {
    top: '10vh',
  },
  CommonTable: {
    size: 'small',
    emptyValue: '—',
    tableLayout: 'fixed',
  },
})

app.mount('#app')
