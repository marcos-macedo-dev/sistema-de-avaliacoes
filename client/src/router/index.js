import { createRouter, createWebHistory } from 'vue-router'
import AvaliacaoView from '../views/AvaliacaoView.vue'
import AgradecimentoView from '../views/AgradecimentoView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'avaliacao',
      component: AvaliacaoView
    },
    {
      path: '/agradecimento',
      name: 'agradecimento',
      component: AgradecimentoView
    }
  ],
})

export default router
