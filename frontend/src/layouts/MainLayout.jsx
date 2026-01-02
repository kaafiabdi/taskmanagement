import React from 'react'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children, hideNavbar = false }) => {
  if (hideNavbar) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-6'>
        {children}
      </div>
    )
  }

  return (
    <>
      <div className='relative bg-gray-50 min-h-screen w-screen overflow-x-hidden flex flex-col'>
        <Navbar />
        <main className='flex-1'>
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}

export default MainLayout;