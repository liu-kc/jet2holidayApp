import httpClient, { useMockApi } from './httpClient'
import { mockRefreshMarketData } from './mock/mockDataSource'

export const refreshMarketData = async () => {
  if (useMockApi) return mockRefreshMarketData()
  const { data } = await httpClient.post('/api/market-data/refresh')
  return data
}