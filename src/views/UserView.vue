<template>
  <div class="max-w-2xl mx-auto w-full space-y-6">
    <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-indigo-100 p-2.5 rounded-full text-indigo-700">
          <i class="fa-solid fa-calendar-day text-lg"></i>
        </div>
        <div>
          <h3 class="font-semibold text-indigo-900">Current Day Cycle</h3>
          <p class="text-sm text-indigo-700 font-medium">{{ currentDayDateFormatted }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <h2 class="text-xl font-bold text-slate-900">ส่งงาน</h2>
        <i class="fa-solid fa-cloud-arrow-up text-indigo-600 text-xl"></i>
      </div>

        <div class="mb-5">
          <label class="block text-sm font-semibold text-slate-700 mb-2">เลขที่ในชั้นเรียน (0 - 150)</label>
          <input 
            v-model.lazy="groupNumber" 
            @change="refreshStatus"
            type="number" 
            min="0" 
            max="151" 
            class="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-2.5 px-3 border"
            placeholder="e.g. 5"
          />
        </div>

        <div class="mt-6">
          <div v-if="status?.submitted" class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex items-center gap-3">
                <div class="bg-emerald-100 p-3 rounded-xl text-emerald-700 text-xl">
                  <i class="fa-regular fa-file-pdf"></i>
                </div>
                <div>
                  <h4 class="font-bold text-emerald-900 text-sm">Status: Submitted Successfully!</h4>
                  <p class="text-xs text-emerald-700 break-all">{{ status.submission.fileName }}</p>
                </div>
              </div>
              <span class="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded">Active</span>
            </div>

            <div class="flex flex-wrap gap-2 pt-2 border-t border-emerald-100">
              <button 
                @click="previewFile"
                class="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <i class="fa-solid fa-eye"></i> View Submitted PDF
              </button>
              <button 
                @click="cancelSubmission"
                class="flex-1 min-w-[120px] bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 border border-rose-200 transition"
              >
                <i class="fa-solid fa-trash-can"></i> Cancel Submission
              </button>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div 
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="handleFileDrop"
              :class="dragOver ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-slate-400 bg-slate-50'"
              class="border-2 border-dashed rounded-xl p-8 text-center transition duration-150 relative"
            >
              <i class="fa-solid fa-file-arrow-up text-4xl text-slate-400 mb-3"></i>
              <p class="text-sm font-semibold text-slate-700">Drag & Drop your PDF file here</p>
              <p class="text-xs text-slate-500 mt-1">or click to browse local files</p>
              
              <input 
                type="file" 
                accept="application/pdf"
                @change="handleFileSelect"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            <div v-if="selectedFile" class="text-sm text-slate-700 mt-2 font-medium break-all text-center">
              Selected: {{ selectedFile.name }}
            </div>
            
            <div v-if="previewUrl" class="mt-4 flex justify-center">
              <img :src="previewUrl" alt="PDF Preview" class="max-h-64 object-contain rounded-lg border border-slate-200 shadow-sm" />
            </div>
            
            <button 
              v-if="selectedFile"
              @click="submitFile"
              class="w-full bg-black hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition mt-4"
            >
              <i class="fa-solid fa-upload"></i> Upload Submission
            </button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, inject } from 'vue';
import { cancelSubmissionRequest, getSubmissionStatus, submitSubmissionRequest } from '../services/api';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const toast = inject('toast');

const groupNumber = ref(1);
const selectedFile = ref(null);
const status = ref(null);
const dragOver = ref(false);
const previewUrl = ref(null);

const currentDayDateFormatted = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

async function generatePreview(file) {
  previewUrl.value = null;
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // Scale for a low-res preview
    const viewport = page.getViewport({ scale: 0.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    previewUrl.value = canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Failed to generate PDF preview:', error);
  }
}

function handleFileSelect(event) {
  selectedFile.value = event.target.files?.[0] || null;
  generatePreview(selectedFile.value);
}

function handleFileDrop(e) {
  dragOver.value = false;
  selectedFile.value = e.dataTransfer.files?.[0] || null;
  generatePreview(selectedFile.value);
}

async function refreshStatus() {
  if (groupNumber.value === null || groupNumber.value === '') {
    status.value = null;
    return;
  }
  try {
    const result = await getSubmissionStatus(groupNumber.value);
    status.value = result;
  } catch (error) {
    toast(error.message || 'Unable to check status.', 'error');
  }
}

async function submitFile() {
  if (!selectedFile.value) {
    toast('Please select a PDF file.', 'error');
    return;
  }
  if (groupNumber.value === null || groupNumber.value < 0 || groupNumber.value > 151) {
    toast('Please enter a valid member ID (0-151).', 'error');
    return;
  }

  try {
    const result = await submitSubmissionRequest({
      groupNumber: groupNumber.value,
      file: selectedFile.value,
    });
    toast(`Submission saved for group ${result.submission.groupNumber}.`, 'success');
    selectedFile.value = null;
    previewUrl.value = null;
    await refreshStatus();
  } catch (error) {
    toast(error.message || 'Unable to upload the file.', 'error');
  }
}

async function previewFile() {
  if (!status.value?.submission?.id) return;
  try {
    const blob = await fetch(`/api/submissions/${status.value.submission.id}/file`).then((response) => {
      if (!response.ok) throw new Error('Unable to load the submitted file.');
      return response.blob();
    });
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
  } catch (error) {
    toast(error.message || 'Unable to preview the file.', 'error');
  }
}

async function cancelSubmission() {
  if (!status.value?.submission?.id) return;
  try {
    await cancelSubmissionRequest(status.value.submission.id);
    toast('Submission canceled successfully.', 'success');
    await refreshStatus();
  } catch (error) {
    toast(error.message || 'Unable to cancel the submission.', 'error');
  }
}

onMounted(() => {
  refreshStatus();
});
</script>
