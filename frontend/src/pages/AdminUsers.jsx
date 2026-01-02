import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import useFetch from '../hooks/useFetch'
import MainLayout from '../layouts/MainLayout'
import Loader from '../components/utils/Loader'

const AdminUsers = () => {
  const authState = useSelector(s => s.authReducer)
  const [fetchData, { loading }] = useFetch()
  const [users, setUsers] = useState([])

  const loadUsers = useCallback(() => {
    const cfg = { url: '/users', method: 'get', headers: { Authorization: authState.token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => setUsers(d.users))
  }, [fetchData, authState.token])

  useEffect(() => { loadUsers() }, [loadUsers])

  return (
    <MainLayout>
      <div className='m-auto my-16 max-w-[1000px] bg-white p-8 border-2 shadow-md rounded-md'>
        <h2 className='mb-4'>Users</h2>
        {loading ? <Loader /> : (
          <table className='w-full'>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className='border-t'>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  )
}

export default AdminUsers
