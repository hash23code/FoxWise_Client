import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export default getRequestConfig(async () => {
  // Try to get locale from cookie first, then from header, fallback to 'en'
  const cookieStore = await cookies()
  const headersList = await headers()

  const locale = cookieStore.get('NEXT_LOCALE')?.value ||
                 headersList.get('x-user-locale') ||
                 'en'

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
