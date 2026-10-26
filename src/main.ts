import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { 분석시작, 화면조회 } from './analytics';

분석시작();
router.afterEach((to) => {
  if (to.path === '/font-editor' || to.path === '/masks' || to.path === '/about') {
    화면조회(to.path.slice(1) as 'font-editor' | 'masks' | 'about');
  }
});
createApp(App).use(router).mount('#app');
