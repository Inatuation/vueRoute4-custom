import { createRouter, createWebHistory, createWebHashHistory } from '@/vue-router4'
import HomeView from '../views/HomeView.vue'
import About from '../views/AboutView.vue'
import A from '../components/A.vue';
import B from '../components/B.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: '/a',
          name: 'a',
          component: A
        },
        {
          path: '/b',
          name: 'b',
          component: B
        }
      ]
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: About
    }
  ]
})

export default router
