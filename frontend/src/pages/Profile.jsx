import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import useFetch from '../hooks/useFetch'

const Profile = () => {
  const authState = useSelector(s => s.authReducer)
  const user = authState.user || {}
  const [fetchData] = useFetch()
  const [totalTasks, setTotalTasks] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const imgWrapperRef = useRef(null)

  useEffect(() => {
    if (!authState.token) return
    const cfg = { url: '/tasks?limit=1', method: 'get', headers: { Authorization: authState.token } }
    fetchData(cfg, { showSuccessToast: false, showErrorToast: false })
      .then(d => setTotalTasks(d.total || 0))
      .catch(() => {})
  }, [authState.token, fetchData])

  const joinedAt = user.joiningTime || user.createdAt
  const joined = joinedAt ? new Date(joinedAt).toLocaleDateString() : '—'

  const initials = (user.name || '').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()

  const handleOverlayClick = () => setShowModal(false)

  useEffect(() => {
    if (!showModal) return
    const onKey = (e) => { if (e.key === 'Escape') setShowModal(false) }
    const prev = document.body.style.overflow
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [showModal])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-8">
        <div className="md:flex md:items-start gap-8">
          <div className="flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                loading="lazy"
                width="128"
                height="128"
                className="w-32 h-32 rounded-full object-cover cursor-pointer"
                onClick={() => setShowModal(true)}
                role="button"
                aria-label="Open avatar preview"
              />
            ) : (
              <div
                onClick={() => setShowModal(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowModal(true) }}
                role="button"
                tabIndex={0}
                aria-label="Open avatar preview"
                className="w-32 h-32 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-semibold cursor-pointer"
              >{initials || 'U'}</div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{user.name || 'No name'}</h2>
                <div className="text-sm text-gray-500 mt-1">{user.email || 'No email'}</div>
                <div className="text-sm text-gray-500 mt-1">Role: {user.role || 'user'}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Joined</div>
                <div className="font-medium">{joined}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded text-center">
                <div className="text-xs text-gray-500">Total Tasks</div>
                <div className="text-xl font-semibold mt-1">{totalTasks === null ? '—' : totalTasks}</div>
              </div>

              <div className="p-4 border rounded text-center">
                <div className="text-xs text-gray-500">Role</div>
                <div className="text-xl font-semibold mt-1">{user.role || 'user'}</div>
              </div>

              <div className="p-4 border rounded text-center">
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm mt-1 break-words">{user.email || '—'}</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium">About</h3>
              <p className="text-sm text-gray-600 mt-2">This is your profile information. To update avatar or other details, use the dropdown in the navbar or update via account settings.</p>
            </div>

            <div className="mt-6 text-right">
              <Link to="/" className="text-indigo-600 hover:underline">Back home</Link>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={handleOverlayClick} role="presentation" aria-hidden={false}>
          <div className="relative max-w-full max-h-full" ref={imgWrapperRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Avatar preview">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar large" loading="lazy" className="max-h-[90vh] max-w-[90vw] object-contain rounded" />
            ) : (
              <div className="w-[min(90vw,600px)] h-[min(90vw,600px)] rounded-full bg-indigo-600 text-white flex items-center justify-center text-6xl font-semibold">{initials || 'U'}</div>
            )}
            <button onClick={() => setShowModal(false)} aria-label="Close avatar preview" className="absolute top-2 right-2 text-white bg-black/40 rounded-full p-2">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
