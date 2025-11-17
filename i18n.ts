import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  // Default to English as requested
  const locale = 'en'

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
