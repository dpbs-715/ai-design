import Mock from 'mockjs'
import { DEFAULT_MOCK_FORM_URL, DEFAULT_MOCK_OPTIONS_URL } from '@/dataSources/defaults.ts'

Mock.setup({
  timeout: 3000,
})

Mock.mock(/\/api\/data/, 'get', (options) => {
  const url = new URL(options.url, location.origin)
  const search = new URLSearchParams(url.search)
  console.log(options)
  const date = search.get('date')
  const data = Mock.mock({
    'list|10': [
      {
        'label|+1': [
          '一月',
          '二月',
          '三月',
          '四月',
          '五月',
          '六月',
          '七月',
          '八月',
          '九月',
          '十月',
        ],
        'value|100-1000': 0,
        date,
      },
    ],
  })
  return data.list
})

Mock.mock(new RegExp(`${DEFAULT_MOCK_OPTIONS_URL}(?:\\?.*)?$`), 'get', () => {
  const data = Mock.mock({
    'list|6': [
      {
        id: '@guid',
        'label|+1': ['一月', '二月', '三月', '四月', '五月', '六月'],
        'value|+1': 1,
        disabled: false,
      },
    ],
  })
  return data.list
})

Mock.mock(new RegExp(`${DEFAULT_MOCK_FORM_URL}(?:\\?.*)?$`), 'get', (options) => {
  const url = new URL(options.url, location.origin)
  const recordId = url.searchParams.get('recordId') ?? 'form-mock'
  return Mock.mock({
    id: recordId,
    name: '@cname',
    'department|1': ['development', 'product', 'finance'],
    'status|1-6': 1,
    tags: [1, 2],
    date: '@date("yyyy-MM-dd")',
    color: '@hex',
  })
})
