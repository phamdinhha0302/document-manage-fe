<template>
  <div class="ocr-result-view">
    <div class="ocr-header">
      <h2>OCR Results</h2>
      <div class="ocr-stats">
        <!-- <div class="stat-item">
          <span class="stat-label">Language</span>
          <span class="stat-value">{{ languageLabel }}</span>
        </div> -->
        <div class="stat-item">
          <span class="stat-label">Độ tin cậy</span>
          <span :class="['stat-value', `confidence-${getConfidenceLevel(confidence)}`]">
            {{ (confidence * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Số trường</span>
          <span class="stat-value">{{ fields.length }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs for different views -->
    <div class="tabs">
      <button
        :class="['tab-button', { active: activeTab === 'viewer' }]"
        @click="activeTab = 'viewer'"
      >
        Visual
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'fields' }]"
        @click="activeTab = 'fields'"
      >
        Fields ({{ fields.length }})
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'text' }]"
        @click="activeTab = 'text'"
      >
        Full Text
      </button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- Visual viewer tab -->
      <div v-if="activeTab === 'viewer'" class="tab-pane active">
        <OCRViewer
          :image-url="imageUrl"
          :fields="fields"
          :document-type="documentType"
        />
      </div>

      <!-- Fields tab -->
      <div v-if="activeTab === 'fields'" class="tab-pane active">
        <div class="fields-view">
          <div v-if="fields.length > 0" class="fields-grid">
            <div
              v-for="(field, index) in fields"
              :key="index"
              class="field-card"
            >
              <div class="field-card-header">
                <span v-if="field.type" class="field-type-badge">{{ field.type }}</span>
                <span :class="['confidence-badge', `confidence-${getConfidenceLevel(field.confidence)}`]">
                  {{ (field.confidence * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="field-card-text">{{ field.text }}</div>
              <div class="field-card-location">
                Position: ({{ field.bbox.x1.toFixed(0) }}, {{ field.bbox.y1.toFixed(0) }})
              </div>
            </div>
          </div>
          <div v-else class="empty-message">
            No fields were extracted from this document.
          </div>
        </div>
      </div>

      <!-- Full text tab -->
      <div v-if="activeTab === 'text'" class="tab-pane active">
        <div class="text-view">
          <div v-if="fullText" class="text-content">
            <p>{{ fullText }}</p>
          </div>
          <div v-else class="empty-message">
            No text was extracted from this document.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import OCRViewer from './OCRViewer.vue'
import type { OCRField } from '@/composables/useOCRViewer'

interface Props {
  imageUrl?: string
  fields?: OCRField[]
  documentType?: string
  language?: string
  confidence?: number
  fullText?: string
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: '',
  fields: () => [],
  documentType: undefined,
  language: 'vi',
  confidence: 0,
  fullText: '',
})

const activeTab = ref<'viewer' | 'fields' | 'text'>('viewer')

const languageLabel = computed(() => {
  const langMap: Record<string, string> = {
    vi: 'Vietnamese',
    eng: 'English',
    fra: 'French',
    deu: 'German',
    spa: 'Spanish',
    jpn: 'Japanese',
    kor: 'Korean',
    chi_sim: 'Chinese (Simplified)',
    chi_tra: 'Chinese (Traditional)',
  }
  return langMap[props.language] || props.language
})

const getConfidenceLevel = (conf: number): string => {
  if (conf >= 0.9) return 'high'
  if (conf >= 0.7) return 'medium'
  return 'low'
}

const formatDocumentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    id_card: 'ID Card',
    passport: 'Passport',
    driver_license: 'Driver License',
    other: 'Other',
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.ocr-result-view {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ocr-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.ocr-header h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.ocr-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.stat-value.confidence-high {
  color: #059669;
}

.stat-value.confidence-medium {
  color: #d97706;
}

.stat-value.confidence-low {
  color: #dc2626;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0 20px;
  gap: 0;
}

.tab-button {
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #1f2937;
  background-color: white;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  min-height: 400px;
}

.tab-pane {
  display: none;
  animation: fadeIn 0.2s;
}

.tab-pane.active {
  display: block;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fields-view {
  padding: 20px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.field-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9fafb;
  transition: all 0.2s;
}

.field-card:hover {
  background-color: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.field-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.field-type-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #3b82f6;
  background-color: #dbeafe;
  padding: 4px 8px;
  border-radius: 4px;
}

.confidence-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.confidence-badge.confidence-high {
  background-color: #d1fae5;
  color: #065f46;
}

.confidence-badge.confidence-medium {
  background-color: #fef3c7;
  color: #92400e;
}

.confidence-badge.confidence-low {
  background-color: #fee2e2;
  color: #991b1b;
}

.field-card-text {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
  word-break: break-word;
  line-height: 1.5;
}

.field-card-location {
  font-size: 11px;
  color: #9ca3af;
}

.text-view {
  padding: 20px;
}

.text-content {
  padding: 16px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  line-height: 1.6;
  color: #374151;
  font-size: 14px;
  word-break: break-word;
  white-space: pre-wrap;
}

.text-content p {
  margin: 0;
}

.empty-message {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Responsive design */
@media (max-width: 768px) {
  .ocr-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .tabs {
    padding: 0;
    overflow-x: auto;
  }

  .tab-button {
    padding: 12px;
    font-size: 12px;
    min-width: 80px;
  }
}
</style>
