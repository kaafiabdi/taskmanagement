import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Textarea } from '../components/utils/Input'
import Loader from '../components/utils/Loader'
import useFetch from '../hooks/useFetch'
import MainLayout from '../layouts/MainLayout'
import validateManyFields from '../validations'

const Task = () => {
  const authState = useSelector(state => state.authReducer)
  const navigate = useNavigate()
  const { taskId } = useParams()
  const [fetchData, { loading }] = useFetch()

  const mode = taskId === undefined ? 'add' : 'update'
  const isAdmin = authState.user?.role === 'admin'

  const [task, setTask] = useState(null)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: '',
    userId: ''
  })
  const [formErrors, setFormErrors] = useState({})

  const isOwner = task?.user?._id === authState.user?._id
  const isAssignee = task?.assignee?._id === authState.user?._id
  // Only admins may edit the description or update the task; owners/assignees may only change status
  const canEdit = authState.user && authState.user.role === 'admin'

  useEffect(() => {
    if (mode === 'add' && !isAdmin) navigate('/')
  }, [mode, isAdmin, navigate])

  // allow viewing task details for any logged-in user; only admins/owners can edit

  useEffect(() => {
    document.title = mode === 'add' ? 'Add Task' : 'Task Details'
  }, [mode])

  const loadTask = useCallback(() => {
    if (mode !== 'update') return
    const cfg = { url: `/tasks/${taskId}`, method: 'get', headers: { Authorization: authState.token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => {
      setTask(d.task)
      setFormData({
        title: d.task.title || '',
        description: d.task.description || '',
        priority: d.task.priority || 'medium',
        dueDate: d.task.dueDate ? String(d.task.dueDate).split('T')[0] : '',
        tags: (d.task.tags || []).join(', '),
      })
    })
  }, [mode, taskId, authState.token, fetchData])

  const loadUsers = useCallback(() => {
    if (mode !== 'add' || !isAdmin) return
    const cfg = { url: '/users', method: 'get', headers: { Authorization: authState.token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => setUsers(d.users)).catch(()=>{})
  }, [mode, isAdmin, authState.token, fetchData])

  useEffect(() => { loadTask() }, [loadTask])
  useEffect(() => { loadUsers() }, [loadUsers])

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = e => {
    e.preventDefault()
    const errors = validateManyFields('task', formData)
    if (errors.length) {
      setFormErrors(errors.reduce((t, o) => ({ ...t, [o.field]: o.err }), {}))
      return
    }
    // Prevent non-admins from submitting updates (they may only change status)
    if (mode === 'update' && authState.user?.role !== 'admin') {
      return
    }

    const cfg = mode === 'add'
      ? { url: '/tasks', method: 'post', data: formData, headers: { Authorization: authState.token } }
      : { url: `/tasks/${taskId}`, method: 'put', data: formData, headers: { Authorization: authState.token } }

    fetchData(cfg).then(() => navigate('/'))
  }

  const handleStatusChange = async status => {
    if (!task) return
    const cfg = { url: `/tasks/${task._id}`, method: 'put', headers: { Authorization: authState.token }, data: { status } }
    await fetchData(cfg)
    loadTask()
  }

  return (
    <MainLayout>
      <form className='m-auto my-16 max-w-[1000px] bg-white p-8 border-2 shadow-md rounded-md'>
        {loading ? <Loader /> : (
          <>
            <h2 className='text-center mb-4'>Task Details</h2>

            {task && (
              <div className='mb-4 flex gap-2'>
                <span className='text-xs px-2 py-1 bg-gray-100 rounded'>Owner: {isOwner ? 'You' : task.user?.name}</span>
                <span className='text-xs px-2 py-1 bg-gray-50 rounded'>Status: {task.status}</span>

                {(isAdmin || isOwner || isAssignee) && (
                  <select
                    value={task.status || 'pending'}
                    onChange={e => handleStatusChange(e.target.value)}
                    className='border px-2 py-1 rounded'
                  >
                    <option value='pending'>Pending</option>
                    <option value='in-progress'>In Progress</option>
                    <option value='completed'>Completed</option>
                  </select>
                )}
              </div>
            )}

            {canEdit ? (
              <Textarea
                value={formData.description}
                disabled={!canEdit}
                onChange={handleChange}
                name='description'
              />
            ) : (
              <div className='whitespace-pre-wrap border rounded p-4 bg-white min-h-[150px] text-gray-800'>
                {formData.description}
              </div>
            )}

            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm'>Title</label>
                <input name='title' value={formData.title} onChange={handleChange} className='w-full border px-2 py-1 rounded' disabled={!canEdit && mode==='update'} />
              </div>

              <div>
                <label className='block text-sm'>Priority</label>
                <select name='priority' value={formData.priority} onChange={handleChange} className='w-full border px-2 py-1 rounded' disabled={!canEdit && mode==='update'}>
                  <option value='low'>Low</option>
                  <option value='medium'>Medium</option>
                  <option value='high'>High</option>
                </select>
              </div>

              <div>
                <label className='block text-sm'>Due Date</label>
                <input type='date' name='dueDate' value={formData.dueDate} onChange={handleChange} className='w-full border px-2 py-1 rounded' disabled={!canEdit && mode==='update'} />
              </div>

              <div>
                <label className='block text-sm'>Tags (comma separated)</label>
                <input name='tags' value={formData.tags} onChange={handleChange} className='w-full border px-2 py-1 rounded' disabled={!canEdit && mode==='update'} />
              </div>
            </div>

            {formErrors.description && (
              <p className='mt-1 text-pink-600 text-sm'>
                  <svg xmlns="http://www.w3.org/2000/svg" className="inline w-4 h-4 mr-2 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z"/></svg>
                  {formErrors.description}
                </p>
            )}

            {/* Assign user when admin creates a task */}
            {mode === 'add' && isAdmin && (
              <div className='mb-4'>
                <label>Assign To</label>
                <select
                  name='userId'
                  value={formData.userId}
                  onChange={handleChange}
                  className='w-full border px-2 py-2 rounded'
                >
                  <option value=''>Select user</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} - {u.email}</option>
                  ))}
                </select>
              </div>
            )}

            {(mode === 'add' && isAdmin) && (
              <button onClick={handleSubmit} className='bg-primary text-white px-4 py-2 mt-4'>
                Add Task
              </button>
            )}

            {(mode === 'update' && canEdit) && (
              <button onClick={handleSubmit} className='bg-primary text-white px-4 py-2 mt-4'>
                Update
              </button>
            )}

            <button onClick={() => navigate('/')} className='ml-4 bg-red-500 text-white px-4 py-2'>
              Back
            </button>
          </>
        )}
      </form>
    </MainLayout>
  )
}

export default Task
