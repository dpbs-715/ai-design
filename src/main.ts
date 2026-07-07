import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Icon } from '@iconify/vue'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)
app.mount('#app')
