import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Icon } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
import { registerComponent, registerComponentDefaultPropsMap } from '@vunio/ui'
import { ElColorPicker, ElInputNumber, ElSwitch } from 'element-plus'
import '@/mock/data.ts'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)

registerComponent({
  number: ElInputNumber,
  color: ElColorPicker,
  switch: ElSwitch,
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
