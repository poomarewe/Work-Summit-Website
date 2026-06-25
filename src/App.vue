<template>
  <div class="relative min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <Navigation />
    
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <transition-group name="toast">
        <div 
          v-for="t in toasts" 
          :key="t.id"
          :class="t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'"
          class="pointer-events-auto p-4 rounded-xl text-white shadow-lg flex items-start gap-3 transform transition-all duration-300"
        >
          <i :class="t.type === 'success' ? 'fa-circle-check' : t.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'" class="fa-solid text-lg mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm font-semibold">{{ t.message }}</p>
          </div>
          <button @click="removeToast(t.id)" class="text-white/80 hover:text-white">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      </transition-group>
    </div>

    <main class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col justify-start">
      <router-view />
    </main>

    <footer class="bg-white border-t border-slate-200 mt-auto py-4 text-center">
      <p class="text-xs text-slate-400 font-medium">© 2026 CollabPDF / Work Summit. Scale-to-Zero System.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';
import Navigation from './components/Navigation.vue';

const toasts = ref([]);

const triggerToast = (message, type = 'success') => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    removeToast(id);
  }, 4000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

provide('toast', triggerToast);
</script>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
