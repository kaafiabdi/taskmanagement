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
    description: '',
    userId: ''
  })
  const [formErrors, setFormErrors] = useState({})

  /* 🚫 User ha geli karin add task page */
  useEffect(() => {
    if (mode === 'add' && !isAdmin) {
      navigate('/')
    }
  }, [mode, isAdmin, navigate])

  /* page title */
  useEffect(() => {
    document.title = mode === 'add' ? 'Add task' : 'Update task'
  }, [mode])

  /* load single task */
  const loadTask = useCallback(() => {
    if (mode !== 'update') return

    const config = {
      url: `/tasks/${taskId}`,
      method: 'get',
      headers: { Authorization: authState.token }
    }

    fetchData(config, { showSuccessToast: false }).then(data => {
      setTask(data.task)
      setFormData({ description: data.task.description })
    })
  }, [mode, taskId, authState.token, fetchData])

  /* load users (admin only) */
  const loadUsers = useCallback(() => {
    if (mode !== 'add' || !isAdmin) return

    const cfg = {
      url: '/users',
      method: 'get',
      headers: { Authorization: authState.token }
    }

    fetchData(cfg, { showSuccessToast: false })
      .then(d => setUsers(d.users))
      .catch(() => {})
  }, [mode, isAdmin, authState.token, fetchData])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleReset = e => {
    e.preventDefault()
    setFormData({ description: task.description })
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errors = validateManyFields('task', formData)
    setFormErrors({})

    if (errors.length > 0) {
      setFormErrors(
        errors.reduce((total, ob) => ({ ...total, [ob.field]: ob.err }), {})
      )
      return
    }

    const config =
      mode === 'add'
        ? {
            url: '/tasks',
            method: 'post',
            data: formData,
            headers: { Authorization: authState.token }
          }
        : {
            url: `/tasks/${taskId}`,
            method: 'put',
            data: formData,
            headers: { Authorization: authState.token }
          }

    fetchData(config).then(() => navigate('/'))
  }

  const fieldError = field => (
    <p
      className={`mt-1 text-pink-600 text-sm ${
        formErrors[field] ? 'block' : 'hidden'
      }`}
    >
      <i className='mr-2 fa-solid fa-circle-exclamation'></i>
      {formErrors[field]}
    </p>
  )

  return (
    <MainLayout>
      <form className='m-auto my-16 max-w-[1000px] bg-white p-8 border-2 shadow-md rounded-md'>
        {loading ? (
          <Loader />
        ) : (
          <>
            <h2 className='text-center mb-4'>
              {mode === 'add' ? 'Add New Task' : 'Edit Task'}
            </h2>

            {mode === 'update' && task && (
              <div className='mb-4 flex gap-2'>
                <span className='text-xs px-2 py-1 bg-gray-100 rounded'>
                  Creator:{' '}
                  {task.user?._id === authState.user?._id
                    ? 'You'
                    : task.user?.name || 'Unknown'}
                </span>

                {task.assignee ? (
                  <span className='text-xs px-2 py-1 bg-green-100 rounded'>
                    Assigned to: {task.assignee.name}
                  </span>
                ) : (
                  <span className='text-xs px-2 py-1 bg-yellow-100 rounded'>
                    Unassigned
                  </span>
                )}
              </div>
            )}

            <div className='mb-4'>
              <label>Description</label>
              <Textarea
                name='description'
                value={formData.description}
                onChange={handleChange}
                placeholder='Write here...'
              />
              {fieldError('description')}
            </div>

            {/* ✅ Assign user (ADMIN ONLY) */}
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
                    <option key={u._id} value={u._id}>
                      {u.name} - {u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ✅ Add / Update button (ADMIN ONLY FOR ADD) */}
            {!(mode === 'add' && !isAdmin) && (
              <button
                className='bg-primary text-white px-4 py-2 font-medium'
                onClick={handleSubmit}
              >
                {mode === 'add' ? 'Add Task' : 'Update Task'}
              </button>
            )}

            <button
              className='ml-4 bg-red-500 text-white px-4 py-2 font-medium'
              onClick={() => navigate('/')}
            >
              Cancel
            </button>

            {mode === 'update' && (
              <button
                className='ml-4 bg-blue-500 text-white px-4 py-2 font-medium'
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </>
        )}
      </form>
    </MainLayout>
  )
}

export default Task
