import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './Router/router.jsx'
import { RouterProvider } from 'react-router'
import AuthProvider from './Context/AuthContext/AuthProvider.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ToastContainer } from 'react-toastify'


const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
         <Toaster position="top-right" reverseOrder={false} /> 
         <ToastContainer />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
