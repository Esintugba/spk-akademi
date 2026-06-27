import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import { ToastContainer } from 'react-toastify'
import { Provider } from 'react-redux'
import { queryClient } from './app/queryClient.ts'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import { router } from './app/router.tsx'
import { store } from './app/store.ts'
import { AppThemeProvider } from './app/AppThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <RouterProvider router={router} />
          <ToastContainer
            autoClose={3500}
            closeOnClick
            newestOnTop
            pauseOnFocusLoss
            pauseOnHover
            position="bottom-right"
            theme="colored"
          />
          </AppThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </Provider>
  </StrictMode>,
)
