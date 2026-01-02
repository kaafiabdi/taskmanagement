import React, { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import useFetch from '../hooks/useFetch'
import Loader from '../components/utils/Loader'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const DashboardAdmin = () => {
  const authState = useSelector(s => s.authReducer)
  const [fetchData, { loading }] = useFetch()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [expandedTasks, setExpandedTasks] = useState(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(12)
  const [total, setTotal] = useState(0)

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', String(perPage));
    const cfg = { url: `/tasks?${params.toString()}`, method: 'get', headers: { Authorization: authState.token } }
    const ucfg = { url: '/users', method: 'get', headers: { Authorization: authState.token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => { setTasks(d.tasks); setTotal(d.total || 0) }).catch(()=>{})
    fetchData(ucfg, { showSuccessToast: false }).then(d => setUsers(d.users)).catch(()=>{})
  }, [authState.token, fetchData, search, statusFilter, page, perPage])

  const navigate = useNavigate()
  const [showUsersPanel, setShowUsersPanel] = useState(false)

  const toggleExpand = (id) => {
    const s = new Set(expandedTasks);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpandedTasks(s);
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    const cfg = { url: `/tasks/${id}`, method: 'delete', headers: { Authorization: authState.token } }
    try {
      await fetchData(cfg)
      load()
    } catch (err) {}
  }

  const handleEdit = (id) => navigate(`/tasks/${id}`)

  const handleUserDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    if (String(id) === String(authState.user?._id)) { alert("You can't delete yourself"); return }
    const cfg = { url: `/users/${id}`, method: 'delete', headers: { Authorization: authState.token } }
    try {
      await fetchData(cfg)
      toast.success('User deleted')
      load()
    } catch (err) { toast.error('Delete failed') }
  }

  const handleToggleRole = async (id, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin'
    if (!window.confirm(`Change role to ${newRole}?`)) return
    const cfg = { url: `/users/${id}/role`, method: 'patch', headers: { Authorization: authState.token }, data: { role: newRole } }
    try {
      await fetchData(cfg)
      toast.success('Role updated')
      load()
    } catch (err) { toast.error('Role update failed') }
  }

  useEffect(() => { if (authState.isLoggedIn) load() }, [authState.isLoggedIn, load])

  
  const completed = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length

  return (
    <div className='p-6 bg-gradient-to-br from-neutral-50 via-white to-sky-50 min-h-screen'>
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center gap-4'>
          {authState.user && authState.user.avatar ? (
            <img src={authState.user.avatar} alt='avatar' loading="lazy" width="48" height="48" className='w-12 h-12 rounded-full object-cover shadow-sm' />
          ) : (
            <div className='w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center' aria-hidden />
          )}
          <div>
            <h2 className='text-2xl font-semibold text-gray-800'>Admin Dashboard</h2>
            <div className='text-sm text-gray-500'>Overview of tasks and users</div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Link to='/tasks/add' className='btn btn-primary inline-flex items-center gap-2 shadow-sm'>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16"/></svg>
            <span className='text-sm'>Add Task</span>
          </Link>
          <button onClick={() => setShowUsersPanel(true)} className='btn btn-ghost inline-flex items-center gap-2'>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1M16 11a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span className='text-sm'>Manage Users</span>
          </button>
          <div className='ml-4 flex items-center gap-2'>
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder='Search tasks...' className='border px-2 py-1 rounded' />
            <select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }} className='border px-2 py-1 rounded'>
              <option value=''>All statuses</option>
              <option value='pending'>Pending</option>
              <option value='in-progress'>In Progress</option>
              <option value='completed'>Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6'>
            <div className='p-4 rounded-lg shadow-sm bg-white border-l-4 border-indigo-300'>
              <div className='text-xs text-indigo-600'>Total Tasks</div>
              <div className='text-2xl font-bold text-indigo-800'>{total}</div>
            </div>
            <div className='p-4 rounded-lg shadow-sm bg-white border-l-4 border-teal-300'>
              <div className='text-xs text-teal-600'>Users</div>
              <div className='text-2xl font-bold text-teal-800'>{users.length}</div>
            </div>
            <div className='p-4 rounded-lg shadow-sm bg-white border-l-4 border-amber-300'>
              <div className='text-xs text-amber-600'>In Progress</div>
              <div className='text-2xl font-bold text-amber-700'>{inProgress}</div>
            </div>
            <div className='p-4 rounded-lg shadow-sm bg-white border-l-4 border-emerald-300'>
              <div className='text-xs text-emerald-600'>Completed</div>
              <div className='text-2xl font-bold text-emerald-700'>{completed}</div>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4'>
            <div className='bg-white/95 rounded-lg shadow-sm p-6 mx-auto w-11/12 md:w-4/5 max-w-5xl'>
              <h3 className='font-semibold mb-4 text-gray-800 text-center'>Recent Tasks</h3>
              {tasks.length === 0 ? (
                <div className='text-gray-500 text-center py-8'>No tasks</div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch'>
                  {tasks.slice(0,8).map(t => (
                    <div key={t._id} className='h-full w-full flex flex-col justify-between p-8 rounded-xl bg-gradient-to-br from-white to-sky-50 shadow-xl hover:shadow-2xl transition-shadow duration-200 ring-1 ring-gray-100 border-transparent'>
                      <div className='flex items-start gap-5'>
                        <div className='flex-shrink-0'>
                          {t.user && t.user.avatar ? (
                            <img src={t.user.avatar} alt='avatar' loading="lazy" width="64" height="64" className='w-16 h-16 rounded-full object-cover' />
                          ) : null}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className={`text-gray-900 font-bold text-xl md:text-2xl ${expandedTasks.has(t._id) ? '' : 'max-h-28 overflow-hidden'}`}>
                            {t.description}
                          </div>
                          {t.description && t.description.length > 200 && (
                            <button onClick={() => toggleExpand(t._id)} className='mt-2 text-sm text-indigo-600 hover:underline'>
                              {expandedTasks.has(t._id) ? 'See less' : 'See more'}
                            </button>
                          )}
                          <div className='mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                            <div>Owner: <span className='font-medium text-gray-800'>{t.user?.name || '—'}</span></div>
                            {t.assignee && <div>Assignee: <span className='font-medium text-gray-800'>{t.assignee?.name}</span></div>}
                          </div>
                        </div>
                      </div>

                      <div className='mt-6 flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <span className={`text-sm font-semibold px-4 py-1 rounded-full ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : t.status === 'in-progress' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{t.status}</span>
                          <div className='text-sm text-gray-500'>{new Date(t.createdAt || t.updatedAt || Date.now()).toLocaleString()}</div>
                        </div>

                        <div className='flex items-center gap-3'>
                          <button title='Edit' onClick={() => handleEdit(t._id)} className='text-indigo-700 hover:bg-indigo-50 px-3 py-1 rounded-md border'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5l8 8-9 9H2v-8z"/></svg>
                          </button>
                          <button title='Delete' onClick={() => handleDelete(t._id)} className='text-red-700 hover:bg-red-50 px-3 py-1 rounded-md border'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Users panel moved to slide-over; left blank here so tasks take full width */}
          </div>

          {/* Slide-over users panel */}
          {showUsersPanel && (
            <div className='fixed inset-0 z-60 flex'>
              <div className='absolute inset-0 bg-black/40' onClick={() => setShowUsersPanel(false)}></div>
              <div className='fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl p-4 overflow-auto transform transition-transform duration-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Manage Users</h3>
                  <button onClick={() => setShowUsersPanel(false)} className='text-gray-500 hover:text-gray-700' aria-label='Close users panel'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                {users.length === 0 ? <div className='text-gray-500'>No users</div> : (
                  <ul className='space-y-2'>
                    {users.map(u => (
                      <li key={u._id} className='flex items-center justify-between gap-3 p-2 rounded-md hover:bg-gray-50'>
                        <div className='flex items-center gap-3 min-w-0'>
                          {u.avatar ? <img src={u.avatar} alt={(u.name || 'User') + " avatar"} loading="lazy" width="32" height="32" className='w-8 h-8 rounded-full object-cover' /> : <div className='w-8 h-8 rounded-full profile-fallback' aria-hidden />}
                          <div className='min-w-0'>
                            <div className='text-sm font-medium truncate'>{u.name}</div>
                            <div className='text-xs text-gray-500 truncate'>{u.email}</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='text-sm text-gray-700 px-2 py-1 rounded-full bg-gray-50'>{u.role}</div>
                          {String(u._id) === String(authState.user?._id) ? (
                            <div className='text-xs text-indigo-600'>You</div>
                          ) : (
                            <div className='flex items-center gap-1'>
                              <button onClick={() => handleToggleRole(u._id, u.role)} className='text-sm text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded'>
                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button onClick={() => handleUserDelete(u._id)} className='text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded'>Delete</button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DashboardAdmin
