import { createRouter, createWebHistory } from 'vue-router';
import UserView from '../views/UserView.vue';
import AdminView from '../views/AdminView.vue';
import HistoryView from '../views/HistoryView.vue';

const routes = [
  { path: '/', name: 'user', component: UserView },
  { path: '/admin', name: 'admin', component: AdminView },
  { path: '/history', name: 'history', component: HistoryView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
