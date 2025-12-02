<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../services/firebase'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const STORAGE_KEY = 'avaliacao-progress'

const categories = [
  { id: 'direcao', title: 'Direção', question: 'A Direção organizou bem o evento e deixou tudo claro pra você?' },
  { id: 'ti_midias', title: 'TI e Mídias', question: 'Som, vídeos, fotos, projeção e QR Codes funcionaram direitinho?' },
  { id: 'ornamentacao', title: 'Ornamentação', question: 'A decoração e a sinalização deixaram o evento bonito e fácil de entender?' },
  { id: 'ntpps_eletivas', title: 'Mostra NTPPS e eletivas', question: 'As apresentações estavam organizadas e nos horários certos?' },
  { id: 'artistico', title: 'Artístico-Cultural', question: 'As apresentações culturais foram boas e bem organizadas?' },
  { id: 'servicos_gerais', title: 'Serviços Gerais', question: 'Os espaços estavam limpos, arrumados e funcionando bem?' },
  { id: 'recepcao', title: 'Recepção', question: 'Você se sentiu bem recebido(a) e bem orientado(a)?' },
  { id: 'alimentacao', title: 'Alimentação', question: 'Os lanches, almoços e a organização dos intervalos foram satisfatórios? O que pode melhorar?' },
  { id: 'diversidade', title: 'Inclusão', question: 'O evento foi acessível e respeitou as diferenças?' },
  { id: 'feira_profissoes', title: 'Feira das Profissões', question: 'Os profissionais explicaram bem e os espaços estavam organizados?' },
  { id: 'cerimonial', title: 'Cerimonial', question: 'O cerimonial conduziu bem falas, recados e momentos importantes?' },
  { id: 'financeiro', title: 'Planejamento', question: 'Os materiais, espaços e recursos do evento foram suficientes?' },
]

// State
const currentStep = ref(0)
const ratings = reactive({})
const comment = ref('')
const email = ref('')
const emailError = ref('')
const loading = ref(false)
const error = ref(null)

// Computed
const totalSteps = computed(() => categories.length + 2)
const isEmailStep = computed(() => currentStep.value === 0)
const isRatingStep = computed(() => currentStep.value > 0 && currentStep.value <= categories.length)
const isCommentStep = computed(() => currentStep.value === totalSteps.value - 1)
const currentCategory = computed(() => {
  if (!isRatingStep.value) return null
  return categories[currentStep.value - 1]
})
const displayQuestionNumber = computed(() => Math.max(currentStep.value, 1))
const progressPercentage = computed(() => { // eslint-disable-line no-unused-vars
  return ((currentStep.value + 1) / totalSteps.value) * 100
})
const canProceed = computed(() => {
  if (isEmailStep.value) return validateEmail(email.value)
  if (isCommentStep.value) return true
  return currentCategory.value && ratings[currentCategory.value.id] !== undefined
})

// Persistence
const saveProgress = () => {
  const payload = {
    email: email.value,
    currentStep: currentStep.value,
    comment: comment.value,
    ratings: { ...ratings },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const loadProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const parsed = JSON.parse(saved)
    if (parsed.email) email.value = parsed.email
    if (parsed.comment) comment.value = parsed.comment
    if (parsed.ratings && typeof parsed.ratings === 'object') {
      Object.assign(ratings, parsed.ratings)
    }
    if (typeof parsed.currentStep === 'number') {
      currentStep.value = Math.min(Math.max(parsed.currentStep, 0), totalSteps.value - 1)
    }
  } catch (e) {
    console.warn('Não foi possível carregar o progresso salvo.', e)
  }
}

watch([ratings, comment, currentStep, email], saveProgress, { deep: true })

// Validation
const validateEmail = (value) => {
  const normalized = value.trim().toLowerCase()
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(normalized)
}

const checkEmailUnique = async (value) => {
  const normalized = value.trim().toLowerCase()
  const q = query(collection(db, 'event_feedbacks'), where('email', '==', normalized), limit(1))
  const snapshot = await getDocs(q)
  return snapshot.empty
}

// Actions
const setRating = (categoryId, value) => {
  if (!currentCategory.value) return
  ratings[categoryId] = value
  setTimeout(() => {
    if (currentStep.value < totalSteps.value - 1) {
      nextStep()
    }
  }, 200) // Faster iOS-like response
}

const nextStep = async () => {
  emailError.value = ''
  if (isEmailStep.value) {
    if (!validateEmail(email.value)) {
      emailError.value = 'Insira um e-mail válido.'
      return
    }
    loading.value = true
    try {
      const isUnique = await checkEmailUnique(email.value)
      if (!isUnique) {
        emailError.value = 'E-mail já utilizado.'
        return
      }
      email.value = email.value.trim().toLowerCase()
    } catch (e) {
      console.error('Erro ao validar e-mail', e)
      emailError.value = 'Erro de conexão. Tente novamente.'
      return
    } finally {
        loading.value = false
    }
  }

  if (currentStep.value < totalSteps.value - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const submitFeedback = async () => {
  loading.value = true
  error.value = null

  try {
    const feedbackData = {
      email: email.value.trim().toLowerCase(),
      ...ratings,
      comment: comment.value,
      timestamp: new Date().toISOString()
    }

    const isUnique = await checkEmailUnique(feedbackData.email)
    if (!isUnique) {
      error.value = 'Avaliação já enviada.'
      return
    }

    await addDoc(collection(db, 'event_feedbacks'), feedbackData)
    localStorage.removeItem(STORAGE_KEY)

    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/agradecimento')
  } catch (e) {
    console.error('Error adding document: ', e)
    error.value = 'Erro ao enviar.'
  } finally {
    loading.value = false
  }
}

const ratingOptions = [
  { value: 1, label: '👎', activeClass: 'bg-[#FF3B30] text-white border-[#FF3B30]', class: 'bg-[#F2F2F7] dark:bg-[#1C1C1E] text-[#8E8E93]' },
  { value: 2, label: '😐', activeClass: 'bg-[#FFCC00] text-white border-[#FFCC00]', class: 'bg-[#F2F2F7] dark:bg-[#1C1C1E] text-[#8E8E93]' },
  { value: 3, label: '👍', activeClass: 'bg-[#34C759] text-white border-[#34C759]', class: 'bg-[#F2F2F7] dark:bg-[#1C1C1E] text-[#8E8E93]' },
]

onMounted(() => {
  loadProgress()
})
</script>

<template>
  <div class="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] font-ios flex flex-col overflow-hidden transition-colors duration-300">

    <!-- iOS Navigation Bar -->
    <div class="bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#3C3C43]/10 dark:border-[#545458]/60 px-4 py-3 flex justify-between items-center h-[44px] box-content">
      <button
        @click="prevStep"
        :disabled="currentStep === 0"
        class="text-[#007AFF] text-[17px] flex items-center gap-1 active:opacity-30 disabled:opacity-0 transition-opacity"
      >
        <ChevronLeft class="w-6 h-6" stroke-width="2.5" />
        Voltar
      </button>

      <div class="text-[17px] font-semibold text-black dark:text-white">
        <span v-if="isEmailStep">Identificação</span>
        <span v-else-if="isRatingStep">{{ displayQuestionNumber }} de {{ categories.length }}</span>
        <span v-else>Finalizar</span>
      </div>

      <button
        v-if="!isCommentStep"
        @click="nextStep"
        :disabled="!canProceed"
        class="text-[#007AFF] text-[17px] font-semibold flex items-center gap-1 active:opacity-30 disabled:text-[#3C3C43]/30 dark:disabled:text-[#EBEBF5]/30 transition-colors"
      >
        {{ isEmailStep ? 'Próximo' : 'Pular' }}
        <ChevronRight v-if="!isEmailStep" class="w-5 h-5" stroke-width="2.5" />
      </button>
      <div v-else class="w-[70px]"></div> <!-- Spacer -->
    </div>

    <!-- Content Area (Inset Grouped List Style) -->
    <div class="flex-grow overflow-y-auto px-4 py-6 sm:max-w-md sm:mx-auto w-full">

      <!-- Title Area -->
      <div class="mb-6 text-center animate-slide-in">
        <h1 class="text-[28px] font-bold text-black dark:text-white mb-1">
          <span v-if="isEmailStep">Seu E-mail</span>
          <span v-else-if="isRatingStep">{{ currentCategory?.title }}</span>
          <span v-else>Comentários</span>
        </h1>
        <p class="text-[15px] text-[#3C3C43]/60 dark:text-[#EBEBF5]/60">
          <span v-if="isEmailStep">Para garantirmos a autenticidade.</span>
          <span v-else-if="isRatingStep">Sua opinião é muito importante.</span>
          <span v-else>Algo que queira adicionar?</span>
        </p>
      </div>

      <!-- iOS Grouped Card -->
      <div class="bg-white dark:bg-[#1C1C1E] rounded-[10px] overflow-hidden shadow-sm animate-scale-up">

        <!-- Email Input -->
        <div v-if="isEmailStep" class="p-0">
          <div class="px-4 py-3 border-b border-[#3C3C43]/10 dark:border-[#545458]/60 last:border-0 flex items-center">
            <span class="text-[17px] text-black dark:text-white w-20">E-mail</span>
            <form @submit.prevent="nextStep" class="flex-grow">
              <input
                type="email"
                v-model="email"
                placeholder="exemplo@gmail.com"
                class="w-full bg-transparent text-[17px] text-[#007AFF] placeholder-[#3C3C43]/30 dark:placeholder-[#EBEBF5]/30 outline-none"
              />
               <!-- Hidden submit -->
               <button type="submit" class="hidden"></button>
            </form>
          </div>
          <p v-if="emailError" class="px-4 py-2 text-[13px] text-[#FF3B30] bg-[#FF3B30]/10 border-t border-[#FF3B30]/20">
            {{ emailError }}
          </p>
        </div>

        <!-- Question Text -->
        <div v-if="isRatingStep" class="px-4 py-6 border-b border-[#3C3C43]/10 dark:border-[#545458]/60 text-center">
          <p class="text-[17px] text-black dark:text-white leading-snug">
            {{ currentCategory?.question }}
          </p>
        </div>

        <!-- Rating Buttons -->
        <div v-if="isRatingStep" class="flex divide-x divide-[#3C3C43]/10 dark:divide-[#545458]/60">
          <button
            v-for="option in ratingOptions"
            :key="currentCategory.id + option.value"
            @click="setRating(currentCategory.id, option.value)"
            class="flex-1 py-4 active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C] transition-colors"
            :class="ratings[currentCategory.id] === option.value ? option.activeClass : 'bg-transparent'"
          >
            <span class="text-[32px] block leading-none">{{ option.label }}</span>
          </button>
        </div>

        <!-- Comment Area -->
        <div v-if="isCommentStep" class="p-0">
          <textarea
            v-model="comment"
            rows="6"
            class="w-full p-4 bg-transparent text-[17px] text-black dark:text-white placeholder-[#3C3C43]/30 dark:placeholder-[#EBEBF5]/30 outline-none resize-none"
            placeholder="Escreva sua mensagem..."
          ></textarea>
        </div>
      </div>

      <!-- Action Button (Mainly for Comment Step) -->
      <div v-if="isCommentStep" class="mt-6">
        <button
          @click="submitFeedback"
          :disabled="loading"
          class="w-full py-3.5 bg-[#007AFF] active:bg-[#0062CC] text-white rounded-[12px] text-[17px] font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ loading ? 'Enviando...' : 'Enviar Avaliação' }}</span>
        </button>
      </div>

      <div v-if="error" class="mt-4 text-center text-[15px] text-[#FF3B30]">
        {{ error }}
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
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
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
