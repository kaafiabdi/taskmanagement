import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="mt-8 border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <div className="text-center md:text-left">
          <div className="font-medium text-gray-800">maskaxwadaag</div>
          <div className="text-xs">A simple MERN task manager — built with ❤️</div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/profile" className="hover:underline">Profile</Link>
          <a href="https://github.com/kaafiabdi/taskmanagement" target="_blank" rel="noopener noreferrer" className="hover:underline">Source</a>
        </div>

        <div className="text-xs text-gray-500">© {new Date().getFullYear()} maskaxwadaag</div>
      </div>
    </footer>
  )
}

export default Footer
