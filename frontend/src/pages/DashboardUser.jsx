import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import useFetch from '../hooks/useFetch'
import Loader from '../components/utils/Loader'

const DashboardUser = () => {
  const authState = useSelector(s => s.authReducer)
  const token = authState.token
  const [fetchData, { loading }] = useFetch()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(12)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(new Set())
  const [tasks, setTasks] = useState([])
  const [expandedTasks, setExpandedTasks] = useState(new Set())

  // fetch tasks whenever auth, page, search or statusFilter change
  useEffect(() => {
    if (!authState.isLoggedIn) return;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', String(perPage));
    const cfg = { url: `/tasks?${params.toString()}`, method: 'get', headers: { Authorization: token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => {
      setTasks(d.tasks || []);
      setTotal(d.total || 0);
    }).catch(()=>{});
  }, [authState.isLoggedIn, fetchData, token, page, perPage, search, statusFilter])

  useEffect(() => { setPage(1); }, [search, statusFilter])

  const handleStatusChange = async (taskId, status) => {
    const cfg = { url: `/tasks/${taskId}`, method: 'put', headers: { Authorization: authState.token }, data: { status } }
    try {
      await fetchData(cfg)
      // refresh list after update
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(perPage));
      const cfg2 = { url: `/tasks?${params.toString()}`, method: 'get', headers: { Authorization: token } }
      fetchData(cfg2, { showSuccessToast: false }).then(d => { setTasks(d.tasks || []); setTotal(d.total || 0); }).catch(()=>{})
    } catch (err) {}
  }

  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  }

  const toggleExpand = (id) => {
    const s = new Set(expandedTasks);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpandedTasks(s);
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm('Delete selected tasks?')) return;
    for (const id of Array.from(selected)) {
      try { await fetchData({ url: `/tasks/${id}`, method: 'delete', headers: { Authorization: authState.token } }, { showSuccessToast: false }) } catch(e){}
    }
    setSelected(new Set());
    // refresh list after deletions
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    params.set('limit', String(perPage));
    const cfg = { url: `/tasks?${params.toString()}`, method: 'get', headers: { Authorization: token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => { setTasks(d.tasks || []); setTotal(d.total || 0); }).catch(()=>{})
  }

  const exportCsv = () => {
    const rows = [ ["Description","Status","Owner","Assignee","CreatedAt"] ];
    tasks.forEach(t => rows.push([t.description.replace(/\n/g,' '), t.status, t.user?.name||'', t.assignee?.name||'', t.createdAt]));
    const csv = rows.map(r => r.map(c => '"'+String(c || '').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tasks.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // keyboard shortcut: 'n' to add task
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'n' && authState.isLoggedIn) window.location.href = '/tasks/add';
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authState.isLoggedIn])

  return (
    <div className='p-6 bg-gradient-to-br from-indigo-50 via-white to-amber-50 min-h-screen'>
      

      {loading ? <Loader /> : (
        <>
        <div className='flex items-center gap-3 mb-4'>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search tasks...' className='border px-2 py-1 rounded w-1/3' />
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className='border px-2 py-1 rounded'>
            <option value=''>All statuses</option>
            <option value='pending'>Pending</option>
            <option value='in-progress'>In Progress</option>
            <option value='completed'>Completed</option>
          </select>
          <button onClick={exportCsv} className='ml-auto bg-indigo-600 text-white px-3 py-1 rounded text-sm'>Export CSV</button>
          {authState.user && authState.user.role === 'admin' && (
            <button onClick={bulkDelete} className='ml-2 bg-red-500 text-white px-3 py-1 rounded text-sm'>Delete Selected</button>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {tasks.map(t => (
            <div key={t._id} className='h-full w-full flex flex-col justify-between p-6 rounded-xl bg-gradient-to-br from-white to-amber-50 shadow-md hover:shadow-lg transition-shadow duration-200 ring-1 ring-gray-100 border-transparent'>
              <div className='flex items-start gap-4'>
                <div className='flex-shrink-0'>
                  {t.user && t.user.avatar ? (
                    <img src={t.user.avatar} alt='avatar' loading="lazy" width="56" height="56" className='w-14 h-14 rounded-full object-cover' />
                  ) : null}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className={`text-gray-900 font-semibold text-lg ${expandedTasks.has(t._id) ? '' : 'max-h-28 overflow-hidden'}`}>
                    {t.description}
                  </div>

                  {t.description && t.description.length > 200 && (
                    <button onClick={() => toggleExpand(t._id)} className='mt-2 text-sm text-indigo-600 hover:underline'>
                      {expandedTasks.has(t._id) ? 'See less' : 'See more'}
                    </button>
                  )}

                  <div className='mt-3 flex items-center gap-3 text-sm text-gray-600'>
                    <div>Owner: <span className='font-medium text-gray-800'>{t.user?.name || 'Unknown'}</span></div>
                    {t.assignee && <div>Assignee: <span className='font-medium text-gray-800'>{t.assignee?.name}</span></div>}
                  </div>

                  {t.tags && t.tags.length > 0 && (
                    <div className='mt-3 text-xs'>
                      {t.tags.map(tag => <span key={tag} className='inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded mr-1 text-xs'>{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div className='mt-4 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  {authState.user && (t.assignee?._id === authState.user._id || t.user?._id === authState.user._id) ? (
                    <select className='border px-2 py-1 text-sm rounded-md bg-white' value={t.status || 'pending'} onChange={(e) => handleStatusChange(t._id, e.target.value)}>
                      <option value='pending'>Pending</option>
                      <option value='in-progress'>In Progress</option>
                      <option value='completed'>Completed</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-3 py-1 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'in-progress' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-50 text-indigo-800'}`}>{t.status}</span>
                  )}
                  <div className='text-xs text-gray-400'>{new Date(t.createdAt || t.updatedAt || Date.now()).toLocaleDateString()}</div>
                </div>

                <div className='flex items-center gap-2'>
                  {authState.user && authState.user.role === 'admin' && (
                    <input type='checkbox' className='mr-2' checked={selected.has(t._id)} onChange={()=>toggleSelect(t._id)} />
                  )}
                  <button title='Open' onClick={() => window.location.href = `/tasks/${t._id}`} className='text-indigo-700 hover:bg-indigo-50 px-3 py-1 rounded-md border'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h6m0 0v6m0-6L10 16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* pagination */}
        <div className='mt-6 flex items-center justify-center gap-4'>
          <button onClick={()=>{ if (page>1) { setPage(p=>p-1); } }} className='px-3 py-1 border rounded'>Prev</button>
          <div className='text-sm'>Page {page} / {Math.max(1, Math.ceil(total / perPage))}</div>
          <button onClick={()=>{ if (page < Math.ceil(total / perPage)) { setPage(p=>p+1); } }} className='px-3 py-1 border rounded'>Next</button>
        </div>
        </>
      )}
    </div>
  )
}

export default DashboardUser
