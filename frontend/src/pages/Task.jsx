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
  const [fetchData, { loading }] = useFetch()
  const { taskId } = useParams()

  const mode = taskId === undefined ? 'add' : 'update'

  const [task, setTask] = useState(null)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    description: '',
    userId: ''
  })
  const [formErrors, setFormErrors] = useState({})

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

  /* load users for admin */
  const loadUsers = useCallback(() => {
    if (mode !== 'add') return
    if (!authState.user || authState.user.role !== 'admin') return

    const cfg = {
      url: '/users',
      method: 'get',
      headers: { Authorization: authState.token }
    }

    fetchData(cfg, { showSuccessToast: false })
      .then(d => setUsers(d.users))
      .catch(() => {})
  }, [mode, authState.user, authState.token, fetchData])

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

    if (mode === 'add') {
      const config = {
        url: '/tasks',
        method: 'post',
        data: formData,
        headers: { Authorization: authState.token }
      }
      fetchData(config).then(() => navigate('/'))
    } else {
      const config = {
        url: `/tasks/${taskId}`,
        method: 'put',
        data: formData,
        headers: { Authorization: authState.token }
      }
      fetchData(config).then(() => navigate('/'))
    }
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

            {mode !== 'add' && task && (
              <div className='mb-4 flex gap-2'>
                <span className='text-xs px-2 py-1 bg-gray-100 rounded text-gray-700'>
                  Creator:{' '}
                  {task.user
                    ? task.user._id === authState.user?._id
                      ? 'You'
                      : task.user.name
                    : 'Unknown'}
                </span>

                {task.assignee ? (
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      task.assignee._id === authState.user?._id
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Assigned to: {task.assignee.name}
                  </span>
                ) : (
                  <span className='text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded'>
                    Unassigned
                  </span>
                )}
              </div>
            )}

            <div className='mb-4'>
              <label htmlFor='description'>Description</label>
              <Textarea
                name='description'
                id='description'
                value={formData.description}
                placeholder='Write here..'
                onChange={handleChange}
              />
              {fieldError('description')}
            </div>

            {mode === 'add' &&
              authState.user &&
              authState.user.role === 'admin' && (
                <div className='mb-4'>
                  <label htmlFor='userId'>Assign To (user)</label>
                  <select
                    id='userId'
                    name='userId'
                    value={formData.userId}
                    onChange={handleChange}
                    className='w-full border px-2 py-2 rounded'
                  >
                    <option value=''>Select a user</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} - {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            <button
              className='bg-primary text-white px-4 py-2 font-medium hover:bg-primary-dark'
              onClick={handleSubmit}
            >
              {mode === 'add' ? 'Add task' : 'Update Task'}
            </button>

            <button
              className='ml-4 bg-red-500 text-white px-4 py-2 font-medium'
              onClick={() => navigate('/')}
            >
              Cancel
            </button>

            {mode === 'update' && (
              <button
                className='ml-4 bg-blue-500 text-white px-4 py-2 font-medium hover:bg-blue-600'
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
