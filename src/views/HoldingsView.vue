<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePortfolioStore } from '../store/portfolioStore'
import BaseButton from '../components/common/BaseButton.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import HoldingsTable from '../components/holdings/HoldingsTable.vue'
import HoldingFormModal from '../components/holdings/HoldingFormModal.vue'

const store = usePortfolioStore()
const search = ref('')
const modalOpen = ref(false)
const deleteDialogOpen = ref(false)
const selectedHolding = ref(null)

const loading = computed(() => store.loading)
const holdings = computed(() => store.holdings)
const summaryItems = computed(() => store.summary?.items || [])
const currency = computed(() => store.account?.currency || 'USD')

const mergedRows = computed(() => {
  const enrichedById = new Map(summaryItems.value.map((item) => [item.id, item]))
  return holdings.value.map((item) => ({ ...item, ...enrichedById.get(item.id) }))
})

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return mergedRows.value
  return mergedRows.value.filter(
    (item) =>
      item.symbol?.toLowerCase().includes(keyword) || item.companyName?.toLowerCase().includes(keyword)
  )
})

const loadData = async () => {
  try {
    await Promise.all([store.loadAccount(), store.loadHoldings(), store.loadSummary()])
  } catch {
  }
}

const openAdd = () => {
  selectedHolding.value = null
  modalOpen.value = true
}

const openEdit = (item) => {
  selectedHolding.value = item
  modalOpen.value = true
}

const requestDelete = (item) => {
  selectedHolding.value = item
  deleteDialogOpen.value = true
}

const submitHolding = async (payload) => {
  try {
    if (selectedHolding.value?.id) {
      await store.editHolding(selectedHolding.value.id, payload)
    } else {
      await store.createHolding(payload)
    }
    modalOpen.value = false
    selectedHolding.value = null
  } catch {
  }
}

const confirmDelete = async () => {
  if (!selectedHolding.value?.id) return
  try {
    await store.removeHolding(selectedHolding.value.id)
    selectedHolding.value = null
  } catch {
  }
}

onMounted(loadData)
</script>

<template>
  <section class="page">
    <div class="page-header">
      <h1>Holdings</h1>
      <div class="actions">
        <input v-model="search" type="text" placeholder="Search by symbol or company" />
        <BaseButton @click="openAdd">Add Holding</BaseButton>
      </div>
    </div>

    <LoadingSpinner v-if="loading.holdings && !holdings.length" />
    <HoldingsTable
      v-else
      :rows="filteredRows"
      :loading="loading.holdings"
      :currency="currency"
      @edit="openEdit"
      @delete="requestDelete"
    />

    <HoldingFormModal
      v-model="modalOpen"
      :initial-data="selectedHolding"
      :loading="loading.mutateHolding"
      @submit="submitHolding"
    />
    <ConfirmDialog
      v-model="deleteDialogOpen"
      title="Delete holding?"
      :message="`Delete ${selectedHolding?.symbol || ''} from portfolio?`"
      confirm-text="Delete"
      @confirm="confirmDelete"
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
  flex-wrap: wrap;
  gap: 0.6rem;
}

.page-header h1 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

input[type='text'] {
  min-width: 260px;
  border: 1px solid var(--color-border);
  border-radius: 0.55rem;
  padding: 0.5rem 0.65rem;
}
</style>