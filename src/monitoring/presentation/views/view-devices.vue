<script setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted, computed } from 'vue';
import { fetchDashboardData } from '../../../shared/infrastructure/services/dashboard.service.js';

const { t } = useI18n();
const devices = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchDashboardData();
    devices.value = data.devices;
  } catch (error) {
    console.error("Error loading devices", error);
  } finally {
    isLoading.value = false;
  }
});

const getTempStatus = (temp) => {
  if (temp > 20) return 'critical';
  if (temp < 0) return 'warning';
  return 'safe';
};

const stats = computed(() => {
  return {
    total: devices.value.length,
    alerts: devices.value.filter(d => d.temperature > 20 || d.humidity > 60).length
  };
});
</script>

<template>
  <div class="devices-view">
    </div>
</template>