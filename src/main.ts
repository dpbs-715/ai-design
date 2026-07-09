import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Icon } from '@iconify/vue'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { registerComponent, registerComponentDefaultPropsMap } from '@vunio/ui'
import { ElColorPicker, ElInputNumber } from 'element-plus'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)

registerComponent({
  inputNumber: ElInputNumber,
  color: ElColorPicker,
})
registerComponentDefaultPropsMap({
  CommonForm: {
    size: 'small',
  },
})

app.mount('#app')
