<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePortfolioStore } from '../store/portfolioStore'
import BaseButton from '../components/common/BaseButton.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import SummaryCards from '../components/dashboard/SummaryCards.vue'
import AllocationPieChart from '../components/dashboard/AllocationPieChart.vue'
import PerformanceLineChart from '../components/dashboard/PerformanceLineChart.vue'
import CategorySummaryCards from '../components/dashboard/CategorySummaryCards.vue'
import HoldingsOverviewTable from '../components/dashboard/HoldingsOverviewTable.vue'
import CashBalanceModal from '../components/account/CashBalanceModal.vue'

const store = usePortfolioStore()
const selectedRange = ref('1M')
const cashModalOpen = ref(false)

const summary = computed(() => store.summary)
const account = computed(() => store.account)
const performance = computed(() => store.performance)
const loading = computed(() => store.loading)
const dashboardItems = computed(() => summary.value?.items || [])
const currency = computed(() => account.value?.currency || summary.value?.currency || 'USD')

const loadData = async () => {
  try {
    await Promise.all([store.loadAccount(), store.loadDashboard(selectedRange.value)])
  } catch {
  }
}

const refreshMarket = async () => {
  try {
    await store.refreshMarketDataAndReload(selectedRange.value)
  } catch {
  }
}

const onRangeChange = async (range) => {
  selectedRange.value = range
  try {
    await store.loadPerformance(range)
  } catch {
  }
}

const saveCashBalance = async (value) => {
  try {
    await store.saveCashBalance(value)
    cashModalOpen.value = false
  } catch {
  }
}

onMounted(loadData)
</script>

<template>
  <section class="page">
    <div class="page-header">
      <h1>Dashboard</h1>
      <div class="actions">
        <BaseButton variant="secondary" :loading="loading.refreshMarket" @click="refreshMarket">
          Refresh Market Data
        </BaseButton>
        <BaseButton @click="cashModalOpen = true">Edit Cash Balance</BaseButton>
      </div>
    </div>

    <LoadingSpinner v-if="loading.dashboard && !summary" />

    <template v-else>
      <SummaryCards :summary="summary" :currency="currency" />
      <div class="grid-two">
        <AllocationPieChart :allocation="summary?.allocation" :category-summary="summary?.categorySummary" />
        <CategorySummaryCards :category-summary="summary?.categorySummary" :currency="currency" />
      </div>
      <HoldingsOverviewTable :items="dashboardItems" :currency="currency" />
      <PerformanceLineChart
        :points="performance?.points || []"
        :range="selectedRange"
        :loading="loading.performance"
        @change-range="onRangeChange"
      />
    </template>

    <CashBalanceModal
      v-model="cashModalOpen"
      :current-balance="account?.cashBalance || 0"
      :loading="loading.updateCash"
      @submit="saveCashBalance"
    />
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.page-header h1 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.grid-two {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 1100px) {
  .grid-two {
    grid-template-columns: 1.2fr 1fr;
  }
}
</style>