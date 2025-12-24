import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import useFetch from '../hooks/useFetch'
import MainLayout from '../layouts/MainLayout'
import Loader from '../components/utils/Loader'

const AdminUsers = () => {
  const authState = useSelector(s => s.authReducer)
  const [fetchData, { loading }] = useFetch()
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState({})

  const loadUsers = () => {
    const cfg = { url: '/users', method: 'get', headers: { Authorization: authState.token } }
    fetchData(cfg, { showSuccessToast: false }).then(d => setUsers(d.users)).catch(()=>{})
  }

  useEffect(() => {
    if (!authState.isLoggedIn || !authState.user || authState.user.role !== 'admin') return
    loadUsers()
  }, [authState.isLoggedIn])

  const handleRoleChange = (id, role) => {
    setEditing(e => ({ ...e, [id]: true }))
    const cfg = { url: `/users/${id}/role`, method: 'patch', headers: { Authorization: authState.token }, data: { role } }
    fetchData(cfg).then(() => {
      setEditing(e => ({ ...e, [id]: false }))
      loadUsers()
    }).catch(() => setEditing(e => ({ ...e, [id]: false })))
  }

  if (!authState.isLoggedIn || !authState.user || authState.user.role !== 'admin') return (
    <MainLayout><div className='m-auto my-16 max-w-[1000px] bg-white p-8 border-2 shadow-md rounded-md'>Not authorized</div></MainLayout>
  )

  return (
    <MainLayout>
      <div className='m-auto my-16 max-w-[1000px] bg-white p-8 border-2 shadow-md rounded-md'>
        <h2 className='mb-4'>Users</h2>
        {loading ? <Loader /> : (
          <table className='w-full'>
            <thead>
              <tr className='text-left'>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className='border-t'>
                  <td className='py-2'>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.role !== 'admin' ? (
                      <button className='bg-blue-500 text-white px-3 py-1 rounded' disabled={editing[u._id]} onClick={() => handleRoleChange(u._id, 'admin')}>Make Admin</button>
                    ) : (
                      <button className='bg-gray-500 text-white px-3 py-1 rounded' disabled={editing[u._id]} onClick={() => handleRoleChange(u._id, 'user')}>Revoke Admin</button>
                    )}
                  </td>
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
