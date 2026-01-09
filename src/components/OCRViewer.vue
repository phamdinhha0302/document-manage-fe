<template>
  <div class="ocr-viewer">
    <div class="toolbar">
      <div class="zoom-controls">
        <button @click="adjustZoom(-0.1)" title="Thu nhỏ" :disabled="!imageUrl" class="tool-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <span class="zoom-level">{{ Math.round(zoomScale * 100) }}%</span>
        <button @click="adjustZoom(0.1)" title="Phóng to" :disabled="!imageUrl" class="tool-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button @click="resetZoom" class="btn-reset" :disabled="!imageUrl">Fit Screen</button>
      </div>
      <div v-if="imageUrl" class="image-info">
        {{ imageSize.width }} x {{ imageSize.height }} px
      </div>
    </div>

    <div class="main-layout">
      <div class="canvas-container" ref="scrollContainer">
        
        <div v-if="!imageUrl" class="empty-state">
          <div class="spinner"></div>
          <p>Đang tải tài liệu...</p>
        </div>

        <div 
          v-else 
          class="fixed-canvas-wrapper" 
          :style="wrapperStyle"
        >
          <img 
            ref="imageRef"
            :src="imageUrl" 
            alt="OCR Document" 
            class="document-image" 
            @load="onImageLoad"
          />
          
          <svg 
            v-if="isReady"
            class="overlay-svg" 
            :viewBox="`0 0 ${imageSize.width} ${imageSize.height}`"
            preserveAspectRatio="none"
          >
            <g v-for="(field, index) in fields" :key="index">
              <rect
                :x="field.bbox.x1"
                :y="field.bbox.y1"
                :width="field.bbox.x2 - field.bbox.x1"
                :height="field.bbox.y2 - field.bbox.y1"
                :class="[
                  'field-bbox', 
                  `confidence-${getConfidenceLevel(field.confidence)}`, 
                  { 'highlighted': hoveredFieldIndex === index }
                ]"
                @mouseenter="hoveredFieldIndex = index"
                @mouseleave="hoveredFieldIndex = -1"
              />
            </g>
          </svg>

          <transition name="fade">
            <div 
              v-if="hoveredFieldIndex !== -1 && activeField" 
              class="ocr-popover"
              :style="popoverStyle"
            >
              <!-- <div class="popover-header">
                <span :class="['popover-conf', `conf-${getConfidenceLevel(activeField.confidence)}`]">
                  Confidence {{ (activeField.confidence * 100).toFixed(0) }}%
                </span>
              </div> -->
              <div class="popover-content">
                {{ activeField.text }}
              </div>
              <div class="popover-arrow" :style="arrowStyle"></div>
            </div>
          </transition>

        </div>
      </div>

      <div class="fields-panel">
        <div class="panel-header">
          <h3>Kết quả trích xuất</h3>
          <span class="badge">{{ fields.length }} items</span>
        </div>
        
        <div class="fields-list">
          <div v-if="fields.length === 0" class="no-data">
            Chưa có dữ liệu OCR
          </div>

          <div
            v-for="(field, index) in fields"
            :key="index"
            :class="['field-item', { 'active': hoveredFieldIndex === index }]"
            @mouseenter="hoveredFieldIndex = index"
            @mouseleave="hoveredFieldIndex = -1"
            @click="scrollToField(index)"
          >
            <div class="field-content">
              <span class="field-number">{{ index + 1 }}</span>
              <span class="field-value" :title="field.text">{{ field.text }}</span>
              <div class="confidence-info">
                <span :class="['confidence-dot', `bg-${getConfidenceLevel(field.confidence)}`]"></span>
                <span class="confidence-text">{{ (field.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type CSSProperties, watch } from 'vue'

// --- Interfaces ---
interface BoundingBox { x1: number; y1: number; x2: number; y2: number }
interface OCRField { text: string; confidence: number; bbox: BoundingBox; type?: string }
interface Props { imageUrl?: string; fields?: OCRField[] }

// --- Props & State ---
const props = withDefaults(defineProps<Props>(), {
  imageUrl: '',
  fields: () => [],
})

const hoveredFieldIndex = ref<number>(-1)
const imageSize = ref({ width: 0, height: 0 })
const zoomScale = ref(1)
const scrollContainer = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)

// --- Computed ---
const isReady = computed(() => imageSize.value.width > 0 && props.fields.length > 0)
const activeField = computed(() => 
  hoveredFieldIndex.value !== -1 ? props.fields[hoveredFieldIndex.value] : null
)

// Wrapper style: kích thước thật của vùng chứa ảnh sau khi zoom
const wrapperStyle = computed<CSSProperties>(() => {
  if (imageSize.value.width === 0) return { visibility: 'hidden' }
  return {
    width: `${imageSize.value.width * zoomScale.value}px`,
    height: `${imageSize.value.height * zoomScale.value}px`,
    position: 'relative'
  }
})

// Tính toán vị trí của HTML Popover
const popoverStyle = computed<CSSProperties>(() => {
  if (!activeField.value) return {}

  const bbox = activeField.value.bbox
  const padding = 10 // Khoảng cách giữa box và tooltip
  
  // Convert tọa độ ảnh gốc -> tọa độ hiển thị (đã zoom)
  const x1 = bbox.x1 * zoomScale.value
  const y1 = bbox.y1 * zoomScale.value
  const x2 = bbox.x2 * zoomScale.value
  const y2 = bbox.y2 * zoomScale.value
  
  const boxWidth = x2 - x1
  const boxHeight = y2 - y1
  
  // Mặc định hiển thị bên dưới
  let top = y2 + padding
  let left = x1 + (boxWidth / 2)
  let transform = 'translate(-50%, 0)' // Căn giữa theo chiều ngang

  // Logic chống tràn (Collision Detection)
  // 1. Nếu quá sát đáy màn hình -> Lật lên trên
  // Giả sử tooltip cao khoảng 100px. Nếu y2 > wrapperHeight - 150 thì lật lên
  const wrapperHeight = imageSize.value.height * zoomScale.value
  const wrapperWidth = imageSize.value.width * zoomScale.value
  const isFlipTop = top > wrapperHeight - 120 

  if (isFlipTop) {
    top = y1 - padding
    transform = 'translate(-50%, -100%)' // Lật lên trên
  }

  // 2. Nếu quá sát lề trái
  if (left < 100) {
    left = x1
    transform = isFlipTop ? 'translate(0, -100%)' : 'translate(0, 0)' // Căn trái
  }
  // 3. Nếu quá sát lề phải
  else if (left > wrapperWidth - 100) {
    left = x2
    transform = isFlipTop ? 'translate(-100%, -100%)' : 'translate(-100%, 0)' // Căn phải
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: transform
  }
})

// Style cho mũi tên (để nó xoay theo hướng tooltip)
const arrowStyle = computed<CSSProperties>(() => {
    // Đơn giản hóa: ẩn mũi tên nếu logic lật phức tạp, 
    // hoặc chỉ hiển thị khi căn giữa chuẩn.
    // Ở đây ta để mặc định hoặc ẩn đi cho UI sạch.
    return { display: 'none' } 
})

// --- Methods ---
const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  imageSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  resetZoom()
}

const adjustZoom = (delta: number) => {
  const newScale = zoomScale.value + delta
  if (newScale >= 0.1 && newScale <= 5.0) {
    zoomScale.value = parseFloat(newScale.toFixed(1))
  }
}

const resetZoom = () => {
  if (!scrollContainer.value || imageSize.value.width === 0) return
  const containerWidth = scrollContainer.value.clientWidth - 40
  const scale = containerWidth / imageSize.value.width
  zoomScale.value = scale < 1 ? parseFloat(scale.toFixed(2)) : 1
}

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.7) return 'medium'
  return 'low'
}

const scrollToField = (index: number) => {
  // Logic scroll sidebar (tùy chọn)
}
</script>

<style scoped>
.ocr-viewer {
  --primary: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg-dark: #1f2937;
  --text-light: #f3f4f6;
  --border: #e5e7eb;
  
  display: flex;
  flex-direction: column;
  height: 65vh;
  border: 1px solid var(--border);
  background: white;
  border-radius: 8px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Toolbar */
.toolbar {
  height: 50px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #fff;
  z-index: 10;
}
.zoom-controls { display: flex; align-items: center; gap: 8px; }
.tool-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 1px solid #d1d5db; background: white; border-radius: 4px;
  cursor: pointer; color: #4b5563;
}
.tool-btn:hover:not(:disabled) { background: #f9fafb; color: var(--primary); border-color: var(--primary); }
.zoom-level { min-width: 48px; text-align: center; font-weight: 600; font-size: 14px; }
.btn-reset { padding: 0 12px; height: 32px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-reset:hover { background: #f9fafb; }
.image-info { font-size: 12px; color: #6b7280; font-family: monospace; }

/* Main Layout */
.main-layout { display: grid; grid-template-columns: 1fr 300px; height: calc(100% - 50px); }

/* Canvas Area */
.canvas-container {
  height: calc(65vh - 50px);
  background: #f3f4f6;
  overflow: auto;
  display: flex;
  padding: 40px;
  /* Quan trọng để căn giữa khi nội dung nhỏ hơn container */
  align-items: flex-start; 
  justify-content: center;
  position: relative;
}

.fixed-canvas-wrapper {
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  /* Quan trọng: để chứa HTML Popover absolute */
  position: relative; 
}

.document-image { width: 100%; height: 100%; display: block; }
.overlay-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }

/* Bounding Box */
.field-bbox {
  fill: rgba(255, 255, 255, 0); /* Trong suốt để thấy chữ bên dưới */
  stroke-width: 2px;
  cursor: pointer;
  pointer-events: auto; /* Để bắt sự kiện hover */
  transition: all 0.1s ease;
}
.field-bbox.confidence-high { stroke: var(--success); }
.field-bbox.confidence-medium { stroke: var(--warning); }
.field-bbox.confidence-low { stroke: var(--danger); }
.field-bbox:hover, .field-bbox.highlighted {
  stroke: var(--primary);
  stroke-width: 2px;
  fill: rgba(59, 130, 246, 0.2);
}

/* --- NEW HTML POPOVER --- */
.ocr-popover {
  position: absolute;
  z-index: 100;
  background: rgba(31, 41, 55, 0.95); /* Dark background */
  backdrop-filter: blur(4px);
  padding: 10px 14px;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  color: white;
  min-width: 150px;
  max-width: 350px; /* Max width để text tự xuống dòng */
  pointer-events: none; /* Không chặn chuột khi di chuyển nhanh */
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid rgba(255,255,255,0.1);
  /* Quan trọng: giữ size font cố định không bị zoom theo wrapper */
  /* Do wrapper zoom bằng width/height px, nên font size 13px ở đây là constant */
}

.popover-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px; padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
.popover-type { font-weight: 700; color: #93c5fd; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
.popover-conf { font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 4px; color: #111; }
.conf-high { background: #6ee7b7; }
.conf-medium { background: #fcd34d; }
.conf-low { background: #fca5a5; }

.popover-content {
  word-wrap: break-word; /* Tự động xuống dòng */
  white-space: pre-wrap;
  font-weight: 400;
}

/* Sidebar Styling */
.fields-panel { background: white; border-left: 1px solid var(--border); display: flex; flex-direction: column; height: calc(65vh - 50px); }
.panel-header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
.panel-header h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 0; }
.badge { background: #e5e7eb; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; color: #4b5563; }
.fields-list { flex: 1; overflow-y: auto; padding: 8px; height: calc(65vh - 100px); }
.field-item { padding: 10px; margin-bottom: 6px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; background: #fff; }
.field-item:hover { background: #f3f4f6; border-color: #d1d5db; }
.field-item.active { background: #eff6ff; border-color: var(--primary); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.field-content { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; align-items: center; }
.field-number {     
  font-weight: 700; 
  font-size: 11px; 
  border-right: solid 1px var(--primary);
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.field-value { font-weight: 500; font-size: 13px; color: #111; word-break: break-all; line-height: 1.4; flex: 1; }
.field-meta { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 500; }
.confidence-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.confidence-info { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.confidence-text { font-size: 12px; font-weight: 600; color: #4b5563; min-width: 35px; text-align: right; }
.bg-high { background: var(--success); }
.bg-medium { background: var(--warning); }
.bg-low { background: var(--danger); }
.no-data, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 13px; gap: 8px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translate(-50%, 5px); }
</style>