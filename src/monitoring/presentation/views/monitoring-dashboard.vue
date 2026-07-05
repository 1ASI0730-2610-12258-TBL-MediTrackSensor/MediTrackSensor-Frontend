<script setup>
import { ref, onMounted } from 'vue';
import ControlCenterPanel from '../components/control-center-panel.vue';
import { fetchDashboardPayload } from '../../../shared/infrastructure/dashboard-payload.js';

const db = ref(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    db.value = await fetchDashboardPayload();
  } catch (error) {
    console.error('Failed to load control center data', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="est-flow-page control-center-page">
    <ControlCenterPanel :db="db" :loading="isLoading" />
  </div>
</template>

<style scoped>
.control-center-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
