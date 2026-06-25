<template>
  <header class="pt-8 pb-4">
    <div class="max-w-2xl mx-auto px-4 flex justify-center">
      <div class="flex items-center bg-white shadow-sm rounded-xl p-1 border border-slate-200">
        <RouterLink 
          to="/"
          class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          active-class="bg-black text-white shadow-sm"
          :class="[$route.path === '/' ? '' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50']"
        >
          <i class="fa-solid fa-user mr-1.5"></i> Member View
        </RouterLink>
        <RouterLink 
          to="/admin"
          class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          active-class="bg-black text-white shadow-sm"
          :class="[($route.path === '/admin' || $route.path === '/history') ? '' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50']"
        >
          <i class="fa-solid fa-user-shield mr-1.5"></i> Admin & History
        </RouterLink>
      </div>
    </div>
  </header>
</template>
