import Mock from 'mockjs'

Mock.setup({
  timeout: 3000,
})

Mock.mock(/\/api\/data/, 'get', (options) => {
  const url = new URL(options.url, location.origin)
  const search = new URLSearchParams(url.search)
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
