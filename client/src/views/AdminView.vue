<script setup>
import { ref, computed } from 'vue'
import { db } from '../services/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { Eye, EyeOff, RefreshCw, Lock, Search } from 'lucide-vue-next'

const feedbacks = ref([])
const loading = ref(false)
const error = ref(null)
const searchTerm = ref('')

// Estado de autenticação simples
const isAuthenticated = ref(false)
const password = ref('')
const loginError = ref('')
const passwordFieldType = ref('password')

const togglePasswordVisibility = () => {
  passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password'
}

const checkPassword = () => {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD
  const correctPassword = envPassword || 'Rafael2025!' 

  if (password.value === correctPassword) {
    isAuthenticated.value = true
    loginError.value = ''
    fetchData()
  } else {
    loginError.value = 'Senha incorreta'
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const q = query(collection(db, 'event_feedbacks'), orderBy('timestamp', 'desc'))
    const querySnapshot = await getDocs(q)
    
    feedbacks.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error("Erro ao buscar feedbacks:", err)
    error.value = "Erro ao carregar dados."
  } finally {
    loading.value = false
  }
}

const filteredFeedbacks = computed(() => {
  if (!searchTerm.value) return feedbacks.value
  const lowerTerm = searchTerm.value.toLowerCase()
  return feedbacks.value.filter(item => 
    (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
    (item.comment && item.comment.toLowerCase().includes(lowerTerm))
  )
})

const formatDate = (timestampString) => {
  if (!timestampString) return '-'
  const date = new Date(timestampString)
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}
</script>

<template>
  <div class="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] font-ios flex flex-col overflow-hidden transition-colors duration-300">

    <!-- iOS Navigation Bar -->
    <div class="bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#3C3C43]/10 dark:border-[#545458]/60 px-4 py-3 flex justify-between items-center h-[44px] box-content">
      <div class="text-[17px] font-semibold text-black dark:text-white flex items-center gap-2">
        <Lock v-if="!isAuthenticated" class="w-4 h-4" />
        <span>Painel Administrativo</span>
      </div>
      
      <button 
        v-if="isAuthenticated"
        @click="fetchData" 
        class="text-[#007AFF] text-[17px] font-semibold flex items-center gap-1 active:opacity-30 transition-opacity"
        :disabled="loading"
      >
        <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Content Area -->
    <div class="flex-grow overflow-y-auto px-4 py-6 w-full">
      
      <!-- Login Screen -->
      <div v-if="!isAuthenticated" class="max-w-md mx-auto mt-10 animate-scale-up">
        <div class="mb-6 text-center">
          <h1 class="text-[28px] font-bold text-black dark:text-white mb-1">Acesso Restrito</h1>
          <p class="text-[15px] text-[#3C3C43]/60 dark:text-[#EBEBF5]/60">
            Digite a senha de administrador para continuar.
          </p>
        </div>

        <div class="bg-white dark:bg-[#1C1C1E] rounded-[10px] overflow-hidden shadow-sm">
          <form @submit.prevent="checkPassword">
            <div class="px-4 py-3 border-b border-[#3C3C43]/10 dark:border-[#545458]/60 flex items-center relative">
              <span class="text-[17px] text-black dark:text-white w-20 font-medium">Senha</span>
              <input 
                v-model="password" 
                :type="passwordFieldType" 
                placeholder="Obrigatório"
                class="flex-grow bg-transparent text-[17px] text-[#007AFF] placeholder-[#3C3C43]/30 dark:placeholder-[#EBEBF5]/30 outline-none pr-8"
              >
              <button type="button" @click="togglePasswordVisibility" class="absolute right-4 text-[#3C3C43]/60 dark:text-[#EBEBF5]/60">
                <Eye v-if="passwordFieldType === 'password'" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
             <!-- Hidden submit to allow Enter key -->
             <button type="submit" class="hidden"></button>
          </form>
          <div v-if="loginError" class="px-4 py-2 text-[13px] text-[#FF3B30] bg-[#FF3B30]/10">
            {{ loginError }}
          </div>
        </div>

        <div class="mt-6">
          <button 
            @click="checkPassword"
            class="w-full py-3.5 bg-[#007AFF] active:bg-[#0062CC] text-white rounded-[12px] text-[17px] font-semibold shadow-sm transition-colors"
          >
            Entrar
          </button>
        </div>
        
        <div v-if="!password" class="mt-8 text-xs text-[#3C3C43]/40 dark:text-[#EBEBF5]/40 text-center">
          (Dica dev: Rafael2025!)
        </div>
      </div>

      <!-- Data Table -->
      <div v-else class="animate-slide-in max-w-[95rem] mx-auto">
        
        <!-- Filter & Count Bar -->
        <div class="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div class="relative w-full sm:max-w-xs">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3C3C43]/60 dark:text-[#EBEBF5]/60" />
              <input 
                v-model="searchTerm"
                type="text" 
                placeholder="Buscar" 
                class="w-full bg-[#767680]/12 dark:bg-[#767680]/24 text-[17px] text-black dark:text-white rounded-[10px] py-2 pl-9 pr-4 outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder-[#3C3C43]/60 dark:placeholder-[#EBEBF5]/60 transition-all"
              >
           </div>
           
           <div class="text-[13px] uppercase font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 bg-[#767680]/12 dark:bg-[#767680]/24 px-3 py-1 rounded-full">
             {{ filteredFeedbacks.length }} {{ filteredFeedbacks.length === 1 ? 'Avaliação' : 'Avaliações' }}
           </div>
        </div>
        
        <div v-if="loading && feedbacks.length === 0" class="text-center py-20 text-[#3C3C43]/60 dark:text-[#EBEBF5]/60">
          Carregando dados...
        </div>

        <div v-else-if="error" class="text-center py-20 text-[#FF3B30]">
          {{ error }}
        </div>

        <div v-else class="bg-white dark:bg-[#1C1C1E] rounded-[10px] shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse">
              <thead class="bg-[#F2F2F7] dark:bg-[#2C2C2E]">
                <tr>
                  <th class="px-4 py-3 text-left text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60">Data</th>
                  <th class="px-4 py-3 text-left text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60">Email</th>
                  <th class="px-4 py-3 text-left text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60 min-w-[250px]">Comentário</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Alimentação">Alim</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Artístico">Art</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Cerimonial">Cerim</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Direção">Dir</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Diversidade">Div</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Feira de Profissões">Feira</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Financeiro">Fin</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="NTPPS/Eletivas">NTPPS</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Ornamentação">Orn</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Recepção">Rec</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="Serviços Gerais">SG</th>
                  <th class="px-2 py-3 text-center text-[13px] uppercase tracking-wider font-semibold text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 border-b border-[#3C3C43]/10 dark:border-[#545458]/60" title="TI/Mídias">TI</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#3C3C43]/10 dark:divide-[#545458]/60">
                <tr v-for="item in filteredFeedbacks" :key="item.id" class="hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors text-[15px] text-black dark:text-white">
                  <td class="px-4 py-3 whitespace-nowrap text-[#3C3C43] dark:text-[#EBEBF5]">{{ formatDate(item.timestamp) }}</td>
                  <td class="px-4 py-3">{{ item.email || 'Anônimo' }}</td>
                  <td class="px-4 py-3 text-[#3C3C43] dark:text-[#EBEBF5]">{{ item.comment }}</td>
                  
                  <!-- Notas -->
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.alimentacao >= 3, 'text-red-500': item.alimentacao <= 1}">{{ item.alimentacao }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.artistico >= 3, 'text-red-500': item.artistico <= 1}">{{ item.artistico }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.cerimonial >= 3, 'text-red-500': item.cerimonial <= 1}">{{ item.cerimonial }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.direcao >= 3, 'text-red-500': item.direcao <= 1}">{{ item.direcao }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.diversidade >= 3, 'text-red-500': item.diversidade <= 1}">{{ item.diversidade }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.feira_profissoes >= 3, 'text-red-500': item.feira_profissoes <= 1}">{{ item.feira_profissoes }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.financeiro >= 3, 'text-red-500': item.financeiro <= 1}">{{ item.financeiro }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.ntpps_eletivas >= 3, 'text-red-500': item.ntpps_eletivas <= 1}">{{ item.ntpps_eletivas }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.ornamentacao >= 3, 'text-red-500': item.ornamentacao <= 1}">{{ item.ornamentacao }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.recepcao >= 3, 'text-red-500': item.recepcao <= 1}">{{ item.recepcao }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.servicos_gerais >= 3, 'text-red-500': item.servicos_gerais <= 1}">{{ item.servicos_gerais }}</td>
                  <td class="px-2 py-3 text-center font-medium" :class="{'text-green-600': item.ti_midias >= 3, 'text-red-500': item.ti_midias <= 1}">{{ item.ti_midias }}</td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="filteredFeedbacks.length === 0 && !loading" class="text-center py-12 text-[#3C3C43]/40 dark:text-[#EBEBF5]/40">
              {{ searchTerm ? 'Nenhum resultado encontrado para a busca.' : 'Nenhum feedback recebido ainda.' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-ios {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

.animate-scale-up {
  animation: scaleUp 0.3s ease-out forwards;
}
</style>