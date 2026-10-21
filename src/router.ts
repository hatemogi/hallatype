import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import FontEditor from './views/FontEditor.vue';
import MaskEditor from './views/MaskEditor.vue';

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: FontEditor,
    },
    {
      path: '/practice',
      name: 'practice',
      component: Home,
    },
    {
      path: '/masks',
      name: 'masks',
      component: MaskEditor,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('./views/About.vue'),
    },
  ],
});
