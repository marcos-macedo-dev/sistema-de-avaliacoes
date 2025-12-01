<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Check } from 'lucide-vue-next'

const router = useRouter()
const timeouts = []

const launchConfetti = () => {
  // iOS System Colors (Blue, Green, Indigo, Orange, Pink, Purple, Red, Teal, Yellow)
  const colors = ['#007AFF', '#34C759', '#5856D6', '#FF9500', '#FF2D55', '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00']
  const totalPieces = 150

  const spawnPiece = () => {
    const piece = document.createElement('div')
    const size = 6 + Math.random() * 6
    const duration = 2.5 + Math.random() * 1.5 // Total animation duration
    const initialDelay = Math.random() * 0.5 // Initial delay before it starts moving
    
    // Randomly choose left or right side
    const fromLeft = Math.random() > 0.5
    const startX = fromLeft ? -10 : 110 // Start slightly off-screen horizontally
    const endX = fromLeft ? 110 : -10 // End on the opposite side
    
    // Random vertical start position, concentrated in the middle
    const startY = 30 + Math.random() * 40 // % viewport height

    // Random drift values
    const driftX = (Math.random() - 0.5) * 200 // Max 100vw left or right drift
    const driftY = (Math.random() - 0.5) * 50 // Max 25vh up or down initial drift
    
    piece.className = 'confetti-piece'
    piece.style.left = `${startX}vw`
    piece.style.top = `${startY}vh` // Set initial vertical position
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    piece.style.width = `${size}px`
    piece.style.height = `${size * 1.4}px`
    
    piece.style.animationDelay = `${initialDelay}s`
    piece.style.animationDuration = `${duration}s`
    piece.style.opacity = `${0.6 + Math.random() * 0.4}`
    
    // Custom properties for keyframes
    piece.style.setProperty('--confetti-start-x', `${startX}vw`)
    piece.style.setProperty('--confetti-start-y', `${startY}vh`)
    piece.style.setProperty('--confetti-end-x', `${endX}vw`)
    piece.style.setProperty('--confetti-end-y-mid', `${startY + driftY}vh`) // Mid-point for initial burst
    piece.style.setProperty('--confetti-end-y-final', `110vh`) // Final fall position
    piece.style.setProperty('--confetti-drift-x', `${driftX}px`)

    // 3D rotation values
    piece.style.setProperty('--confetti-rotate-x', `${Math.random() * 720 - 360}deg`) // Full rotations
    piece.style.setProperty('--confetti-rotate-y', `${Math.random() * 720 - 360}deg`)
    piece.style.setProperty('--confetti-rotate-z', `${Math.random() * 720 - 360}deg`)
    
    piece.style.willChange = 'transform, opacity'
    document.body.appendChild(piece)

    const removal = setTimeout(() => piece.remove(), (duration + 1) * 1000)
    timeouts.push(removal)
  }

  for (let i = 0; i < totalPieces; i++) {
    const delay = i * 12 // Stagger spawn
    timeouts.push(setTimeout(spawnPiece, delay))
  }
}

onMounted(() => {
  launchConfetti()
})

onBeforeUnmount(() => {
  timeouts.forEach(clearTimeout)
})
</script>

<template>
  <div class="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] flex items-center justify-center p-6 font-ios transition-colors duration-300 overflow-hidden">
    <div class="flex flex-col items-center max-w-sm w-full text-center animate-scale-up relative z-10">
      
      <!-- iOS Success Icon (SF Symbol style) -->
      <div class="mb-6 h-24 w-24 rounded-full bg-white dark:bg-[#1C1C1E] shadow-sm flex items-center justify-center">
        <Check class="w-12 h-12 text-[#34C759]" stroke-width="3" />
      </div>

      <h1 class="text-[28px] font-bold text-black dark:text-white mb-2">Obrigado!</h1>
      <p class="text-[17px] text-[#3C3C43]/60 dark:text-[#EBEBF5]/60 mb-10 leading-normal">
        Sua avaliação foi enviada com sucesso. Agradecemos sua participação.
      </p>

      <button 
        @click="router.push('/')" 
        class="text-[#007AFF] text-[17px] font-semibold active:opacity-50 transition-opacity"
      >
        Avaliar Novamente
      </button>
    </div>
  </div>
</template>

<style scoped>
.font-ios {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-scale-up {
  animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

:global(@keyframes confetti-fall) {
  0% {
    transform: translate3d(var(--confetti-start-x), var(--confetti-start-y), 0) 
               rotateX(0) rotateY(0) rotateZ(0);
    opacity: 0;
  }
  20% { /* Burst outwards */
    transform: translate3d(
                  calc(var(--confetti-start-x) + var(--confetti-drift-x)), 
                  var(--confetti-end-y-mid), 
                  0) 
               rotateX(var(--confetti-rotate-x, 0deg)) 
               rotateY(var(--confetti-rotate-y, 0deg)) 
               rotateZ(var(--confetti-rotate-z, 0deg));
    opacity: 1;
  }
  100% { /* Fall down */
    transform: translate3d(
                  calc(var(--confetti-start-x) + var(--confetti-drift-x) * 1.5), 
                  var(--confetti-end-y-final), 
                  0) 
               rotateX(var(--confetti-rotate-x, 0deg)) 
               rotateY(var(--confetti-rotate-y, 0deg)) 
               rotateZ(var(--confetti-rotate-z, 0deg));
    opacity: 0;
  }
}

:global(.confetti-piece) {
  position: fixed;
  border-radius: 2px;
  animation: confetti-fall var(--duration) ease-out forwards;
  pointer-events: none;
  z-index: 5;
}
</style>