import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/api/generate-quiz(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // For protected routes, ensure user is authenticated
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('🚫 Unauthorized access attempt to:', req.nextUrl.pathname)
      
      // For API routes, return JSON error
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }
      
      // For pages, redirect to sign-in
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
    
    console.log('✅ Middleware: User authenticated:', userId)
    
    // Add user info to headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', userId)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

