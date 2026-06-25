<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">Merge Operations</h3>
          <p class="text-xs text-slate-500 mb-6">Aggregate, sort, and output the documents into a cohesive PDF instantly.</p>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 mb-6">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500">Submissions received:</span>
              <span class="font-semibold text-slate-700">{{ submissions.length }} files</span>
            </div>
          </div>

          <button 
            @click="downloadMergedPdf"
            :disabled="submissions.length === 0"
            :class="submissions.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-black hover:bg-slate-800 text-white shadow-md'"
            class="w-full font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition"
          >
            <i class="fa-solid fa-file-pdf"></i> Download Merged PDF
          </button>
        </div>
      </div>

      <div class="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 class="text-base font-bold text-slate-900">Today's Live Submissions</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-medium text-xs">
                <th class="py-3 px-2">Member ID</th>
                <th class="py-3 px-2">Filename</th>
                <th class="py-3 px-2">Upload Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="sub in submissions" 
                :key="sub.id"
                class="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition"
              >
                <td class="py-3 px-2 font-semibold">#{{ sub.groupNumber }}</td>
                <td class="py-3 px-2">
                  <div class="flex items-center gap-2 max-w-xs md:max-w-md">
                    <i class="fa-regular fa-file-pdf text-rose-500 text-base shrink-0"></i>
                    <span class="truncate font-medium text-xs">{{ sub.fileName }}</span>
                  </div>
                </td>
                <td class="py-3 px-2 text-xs text-slate-500">{{ new Date(sub.uploadedAt).toLocaleString() }}</td>
              </tr>
              <tr v-if="submissions.length === 0">
                <td colspan="3" class="py-8 text-center text-slate-400 text-xs italic">No submissions yet for today.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getTodaySubmissions } from '../services/api';

const submissions = ref([]);

async function loadSubmissions() {
  try {
    const data = await getTodaySubmissions();
    submissions.value = data.submissions || [];
  } catch (error) {
    console.error(error);
  }
}

function downloadMergedPdf() {
  window.open('/api/admin/download/today', '_blank');
}

onMounted(() => {
  loadSubmissions();
});
</script>
