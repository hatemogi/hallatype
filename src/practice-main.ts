import { createApp } from 'vue';
import PracticeEntry from './views/PracticeEntry.vue';
import { 분석시작 } from './analytics';

분석시작();
createApp(PracticeEntry).mount('#app');
