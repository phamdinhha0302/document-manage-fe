<template>
    <div class="documents-page">
        <FolderExplorer />
    </div>
</template>

<script setup lang="ts">
import FolderExplorer from '@/components/FolderExplorer.vue'
</script>

<style scoped>
.documents-page {
    min-height: 100vh;
    background-color: #f5f5f5;
}
</style>