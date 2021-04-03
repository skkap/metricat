import Vue from 'vue';
import VueRouter from 'vue-router';
import MetricsPage from '../components/MetricsPage.vue';
import ConnectionPage from '../components/ConnectionPage.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/recording',
    name: 'recording',
    component: MetricsPage,
    props: (route) => {
      return {
        url: route.query.url,
        intervalMillis: parseInt(route.query.intervalMillis)
      };
    }
  },
  {
    path: '/connection',
    name: 'connection',
    component: ConnectionPage
  }
];

const router = new VueRouter({
  routes
});

export default router;
