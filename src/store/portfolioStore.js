import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAccount, updateCashBalance } from '../api/accountApi'
import { getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem } from '../api/portfolioApi'
import { getDashboardSummary, getPerformance } from '../api/dashboardApi'
import { refreshMarketData } from '../api/marketDataApi'
import { normalizeApiError } from '../api/httpClient'

export const usePortfolioStore = defineStore('portfolio', () => {
  // Core domain state shared across dashboard and holdings pages.
  const account = ref(null)
  const summary = ref(null)
  const holdings = ref([])
  const performance = ref({ range: '1M', points: [] })

  // Granular loading flags let each view render precise loading UI.
  const loading = ref({
    dashboard: false,
    holdings: false,
    performance: false,
    mutateHolding: false,
    updateCash: false,
    refreshMarket: false
  })

  // Global toast-like message consumed by App shell.
  const notification = ref({ type: 'success', message: '' })

  const setNotification = (type, message) => {
    notification.value = { type, message }
  }

  const clearNotification = () => {
    notification.value = { type: 'success', message: '' }
  }

  const loadAccount = async () => {
    try {
      account.value = await getAccount()
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to load account info.'))
      throw error
    }
  }

  const loadSummary = async () => {
    loading.value.dashboard = true
    try {
      summary.value = await getDashboardSummary()
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to load dashboard summary.'))
      throw error
    } finally {
      loading.value.dashboard = false
    }
  }

  const loadPerformance = async (range = '1M') => {
    loading.value.performance = true
    try {
      const response = await getPerformance(range)
      // Normalize shape defensively so chart components never crash on partial payloads.
      performance.value = {
        range: response?.range || range,
        points: Array.isArray(response?.points) ? response.points : []
      }
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to load performance chart.'))
      throw error
    } finally {
      loading.value.performance = false
    }
  }

  // Dashboard depends on both summary metrics and performance series.
  const loadDashboard = async (range = '1M') => {
    await Promise.all([loadSummary(), loadPerformance(range)])
  }

  const loadHoldings = async () => {
    loading.value.holdings = true
    try {
      holdings.value = await getPortfolioItems()
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to load holdings.'))
      throw error
    } finally {
      loading.value.holdings = false
    }
  }

  const createHolding = async (payload) => {
    loading.value.mutateHolding = true
    try {
      await createPortfolioItem(payload)
      // Keep holdings grid and dashboard cards/charts consistent after write operations.
      await Promise.all([loadHoldings(), loadSummary()])
      setNotification('success', 'Holding added successfully.')
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to add holding.'))
      throw error
    } finally {
      loading.value.mutateHolding = false
    }
  }

  const editHolding = async (id, payload) => {
    loading.value.mutateHolding = true
    try {
      await updatePortfolioItem(id, payload)
      await Promise.all([loadHoldings(), loadSummary()])
      setNotification('success', 'Holding updated successfully.')
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to update holding.'))
      throw error
    } finally {
      loading.value.mutateHolding = false
    }
  }

  const removeHolding = async (id) => {
    loading.value.mutateHolding = true
    try {
      await deletePortfolioItem(id)
      await Promise.all([loadHoldings(), loadSummary()])
      setNotification('success', 'Holding deleted successfully.')
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to delete holding.'))
      throw error
    } finally {
      loading.value.mutateHolding = false
    }
  }

  const saveCashBalance = async (cashBalance) => {
    loading.value.updateCash = true
    try {
      await updateCashBalance({ cashBalance })
      // Cash edits affect both account widget data and dashboard totals.
      await Promise.all([loadAccount(), loadSummary()])
      setNotification('success', 'Cash balance updated successfully.')
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to update cash balance.'))
      throw error
    } finally {
      loading.value.updateCash = false
    }
  }

  const refreshMarketDataAndReload = async (range = performance.value.range || '1M') => {
    loading.value.refreshMarket = true
    try {
      const response = await refreshMarketData()
      const message = response?.message || 'Market data refreshed successfully.'
      // Refresh affects valuation-sensitive areas: summary totals and performance chart.
      await Promise.all([loadSummary(), loadPerformance(range)])
      setNotification('success', message)
      return response
    } catch (error) {
      setNotification('error', normalizeApiError(error, 'Failed to refresh market data.'))
      throw error
    } finally {
      loading.value.refreshMarket = false
    }
  }

  return {
    account,
    summary,
    holdings,
    performance,
    loading,
    notification,
    clearNotification,
    loadAccount,
    loadSummary,
    loadPerformance,
    loadDashboard,
    loadHoldings,
    createHolding,
    editHolding,
    removeHolding,
    saveCashBalance,
    refreshMarketDataAndReload
  }
})