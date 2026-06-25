<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Archived Collection Dates</h3>
      
      <div v-if="dates.length === 0" class="text-center py-8 text-slate-400 text-xs">
        <i class="fa-solid fa-folder-open text-3xl text-slate-300 mb-2 block"></i>
        No archival cycles found.
      </div>
      <div v-else class="space-y-2">
        <button 
          v-for="date in dates" 
          :key="date"
          @click="selectDate(date)"
          :class="selectedDate === date ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'border-slate-100 hover:bg-slate-50 text-slate-700'"
          class="w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition"
        >
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-box-archive text-slate-400"></i>
            <div>
              <p class="text-xs font-semibold">{{ date }}</p>
            </div>
          </div>
          <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
        </button>
      </div>
    </div>

    <div class="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div v-if="selectedDate" class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900">Archive Details: {{ selectedDate }}</h3>
            <p class="text-xs text-slate-500">Includes archived files for this daily cycle.</p>
          </div>
          <button 
            @click="downloadHistoryPdf"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition"
          >
            <i class="fa-solid fa-file-zipper"></i> Merge & Download Archive
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 text-xs font-medium">
                <th class="py-2.5">No.</th>
                <th class="py-2.5">File Name</th>
                <th class="py-2.5">Upload Time</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="sub in historyEntries" 
                :key="sub.id"
                class="border-b border-slate-100 text-slate-700 text-xs hover:bg-slate-50 transition"
              >
                <td class="py-3 font-semibold text-slate-500">#{{ sub.groupNumber }}</td>
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <i class="fa-regular fa-file-pdf text-slate-400"></i>
                    <span class="font-medium max-w-sm truncate">{{ sub.fileName }}</span>
                  </div>
                </td>
                <td class="py-3 text-slate-500">{{ new Date(sub.uploadedAt).toLocaleString() }}</td>
              </tr>
              <tr v-if="historyEntries.length === 0">
                <td colspan="3" class="py-8 text-center text-slate-400 italic">No submissions for this date.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="text-center py-20 text-slate-400">
        <i class="fa-regular fa-folder text-4xl block mb-3 text-slate-300"></i>
        Please select an archive date on the left to see transaction histories and compile PDF merges.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getHistoryDates, getHistoryByDate } from '../services/api';

const dates = ref([]);
const selectedDate = ref('');
const historyEntries = ref([]);

async function loadDates() {
  try {
    const result = await getHistoryDates();
    dates.value = result.dates || [];
  } catch (error) {
    console.error(error);
  }
}

async function selectDate(date) {
  selectedDate.value = date;
  await loadHistory();
}

async function loadHistory() {
  if (!selectedDate.value) {
    historyEntries.value = [];
    return;
  }
  try {
    const result = await getHistoryByDate(selectedDate.value);
    historyEntries.value = result.submissions || [];
  } catch (error) {
    console.error(error);
  }
}

function downloadHistoryPdf() {
  if (!selectedDate.value) return;
  window.open(`/api/admin/download/${selectedDate.value}`, '_blank');
}

onMounted(() => {
  loadDates();
});
</script>
