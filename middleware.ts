import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Get locale from cookie or default to 'en'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en'

  // Create a new response
  const response = NextResponse.next()

  // Set the locale in the response headers for i18n to use
  response.headers.set('x-user-locale', locale)

  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
