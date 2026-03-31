import httpClient, { useMockApi } from './httpClient'
import { mockGetAccount, mockUpdateCashBalance } from './mock/mockDataSource'

export const getAccount = async () => {
  if (useMockApi) return mockGetAccount()
  const { data } = await httpClient.get('/api/account')
  return data
}

export const updateCashBalance = async (payload) => {
  if (useMockApi) return mockUpdateCashBalance(payload)
  const { data } = await httpClient.put('/api/account/cash-balance', payload)
  return data
}