import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { logout, saveProfile } from '../redux/actions/authActions'
import api from '../api'
import { toast } from 'react-toastify'
import LOGO from '../iconprofile/download.png'

const Navbar = () => {
  const authState = useSelector(state => state.authReducer)
  const dispatch = useDispatch()

  const [isNavbarOpen, setIsNavbarOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const fileRef = useRef()
  const dropdownRef = useRef()

  const toggleNavbar = () => setIsNavbarOpen(s => !s)
  const toggleDropdown = () => setIsDropdownOpen(s => !s)

  const handleLogoutClick = () => {
    dispatch(logout())
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  return (
    <header
      className="
        sticky top-0 z-50
        h-16 px-6
        flex justify-between items-center
        text-white
        border-b border-white/10
        shadow-md
        bg-gradient-to-r
        from-slate-900 via-sky-900/60 to-slate-800
        backdrop-blur-sm
      "
    >
      {/* LOGO */}
      <h2 className="flex items-center  font-serif font-extrabold">
        <img
          src={LOGO}
          alt="logo"
          loading="lazy"
          width="80"
          height="80"
          className="h-20 w-20 object-contain"
        />
        <span  className="
    text-xl
    font-extrabold
    tracking-wide
    leading-none
    whitespace-nowrap
    bg-gradient-to-r
    from-sky-400 via-blue-500 to-indigo-500
    bg-clip-text
    text-transparent
    drop-shadow-sm
  ">
          maskaxwadaag
        </span>
      </h2>

      {/* DESKTOP MENU */}
      <ul className="hidden md:flex items-center gap-4">
        {authState.isLoggedIn ? (
          <li className="relative">
            <button
              onClick={toggleDropdown}
              className="
                flex items-center gap-2
                px-3 py-1
                rounded-full
                bg-white/20 hover:bg-white/30
                transition
                backdrop-blur-sm
                ring-1 ring-white/10
              "
            >
                {authState.user?.avatar ? (
                <img
                  src={authState.user.avatar}
                  alt="avatar"
                  loading="lazy"
                  width="36"
                  height="36"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-400"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-semibold">
                  {(authState.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <span className="text-sm text-white/90 max-w-[140px] truncate">
                {authState.user?.name?.split(' ')[0] || 'User'}
              </span>
            </button>

            {/* DROPDOWN */}
            <div
              ref={dropdownRef}
              className={`absolute right-0 mt-3 w-64 bg-white text-gray-800 rounded-md shadow-md p-3 z-50 ${
                isDropdownOpen ? '' : 'hidden'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {authState.user?.avatar ? (
                  <img
                    onDoubleClick={() => fileRef.current?.click()}
                    src={authState.user.avatar}
                    loading="lazy"
                    width="48"
                    height="48"
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover cursor-pointer ring-2 ring-sky-400"
                  />
                ) : (
                  <div
                    onDoubleClick={() => fileRef.current?.click()}
                    className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-semibold cursor-pointer"
                  >
                    {(authState.user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {authState.user?.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {authState.user?.email}
                  </div>
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files[0]
                  if (!f) return
                  const form = new FormData()
                  form.append('avatar', f)
                  try {
                    await api.put('/profile/avatar', form, {
                      headers: {
                        Authorization: authState.token,
                        'Content-Type': 'multipart/form-data'
                      }
                    })
                    toast.success('Avatar updated')
                    dispatch(saveProfile(authState.token))
                  } catch {
                    toast.error('Upload failed')
                  }
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="bg-sky-600 text-white px-3 py-1 rounded-md text-sm"
                >
                  Upload
                </button>
                {authState.user?.avatar && (
                  <button
                    onClick={async () => {
                      try {
                        await api.delete('/profile/avatar', {
                          headers: { Authorization: authState.token }
                        })
                        toast.success('Avatar removed')
                        dispatch(saveProfile(authState.token))
                      } catch (e) {
                        toast.error('Remove failed')
                      }
                    }}
                    className="px-3 py-1 rounded-md text-sm text-gray-700 bg-gray-100"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={handleLogoutClick}
                  className="ml-auto text-sm text-red-600"
                >
                  Logout
                </button>
              </div>

              <div className="text-right mt-2">
                <Link
                  to="/profile"
                  className="text-sm text-sky-600 hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </li>
        ) : (
          <li>
            <Link to="/login" className="text-white/90 hover:underline">
              Login
            </Link>
          </li>
        )}
      </ul>

      {/* MOBILE ICON */}
      <span className="md:hidden cursor-pointer" onClick={toggleNavbar}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </span>
    </header>
  )
}

export default Navbar
