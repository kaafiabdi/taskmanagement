import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import Loader from './utils/Loader';
import Tooltip from './utils/Tooltip';

const Tasks = () => {

  const authState = useSelector(state => state.authReducer);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [assigneeMap, setAssigneeMap] = useState({});
  const [fetchData, { loading }] = useFetch();

  const fetchTasks = useCallback(() => {
    const config = { url: "/tasks", method: "get", headers: { Authorization: authState.token } };
    fetchData(config, { showSuccessToast: false }).then(data => setTasks(data.tasks));
  }, [authState.token, fetchData]);

  useEffect(() => {
    if (!authState.isLoggedIn) return;
    fetchTasks();
    // if admin, fetch users for assignment
    if (authState.user && authState.user.role === "admin") {
      const config = { url: "/users", method: "get", headers: { Authorization: authState.token } };
      fetchData(config, { showSuccessToast: false }).then(data => setUsers(data.users)).catch(()=>{});
    }
  }, [authState.isLoggedIn, fetchTasks]);


  const handleDelete = (id) => {
    const config = { url: `/tasks/${id}`, method: "delete", headers: { Authorization: authState.token } };
    fetchData(config).then(() => fetchTasks());
  }


  return (
    <>
      <div className="my-2 mx-auto max-w-[700px] py-4">

        {tasks.length !== 0 && <h2 className='my-2 ml-2 md:ml-0 text-xl'>Your tasks ({tasks.length})</h2>}
        {loading ? (
          <Loader />
        ) : (
          <div>
            {tasks.length === 0 ? (

              <div className='w-[600px] h-[300px] flex items-center justify-center gap-4'>
                <span>No tasks found</span>
                <Link to="/tasks/add" className="bg-blue-500 text-white hover:bg-blue-600 font-medium rounded-md px-4 py-2">+ Add new task </Link>
              </div>

            ) : (
              tasks.map((task, index) => (
                <div key={task._id} className='bg-white my-4 p-4 text-gray-600 rounded-md shadow-md'>
                  <div className='flex'>

                    <span className='font-medium'>Task #{index + 1}</span>

                    <Tooltip text={"Edit this task"} position={"top"}>
                      <Link to={`/tasks/${task._id}`} className='ml-auto mr-2 text-green-600 cursor-pointer'>
                        <i className="fa-solid fa-pen"></i>
                      </Link>
                    </Tooltip>

                    <Tooltip text={"Delete this task"} position={"top"}>
                      <span className='text-red-500 cursor-pointer' onClick={() => handleDelete(task._id)}>
                        <i className="fa-solid fa-trash"></i>
                      </span>
                    </Tooltip>

                  </div>
                  <div className='whitespace-pre'>{task.description}</div>
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='text-xs px-2 py-1 bg-gray-100 rounded text-gray-700'>
                      Created by: {task.user? (task.user._id === authState.user?._id ? 'You' : task.user.name) : 'Unknown'}
                    </span>
                    {task.assignee ? (
                      <span className={`text-xs px-2 py-1 rounded ${task.assignee._id === authState.user?._id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        Assigned to: {task.assignee.name}
                      </span>
                    ) : (
                      <span className='text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded'>Unassigned</span>
                    )}

                    {authState.user && authState.user.role === "admin" && (
                    <div className='mt-2 flex items-center gap-2'>
                      <select className='border px-2 py-1 rounded' value={assigneeMap[task._id] || (task.assignee?._id || "")} onChange={(e)=> setAssigneeMap(s=>({...s, [task._id]: e.target.value}))}>
                        <option value="">Unassigned</option>
                        {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} - {u.email}</option>
                          ))}
                      </select>
                      <button className='bg-blue-500 text-white px-3 py-1 rounded' onClick={async ()=>{
                        const userId = assigneeMap[task._id] || "";
                        const config = { url: `/tasks/${task._id}/assign`, method: "post", headers: { Authorization: authState.token }, data: { userId } };
                        try {
                          await fetchData(config);
                          fetchTasks();
                        } catch (err) {}
                      }}>Assign</button>
                      {task.assignee && <span className='text-sm text-gray-500'> </span>}
                    </div>
                    )}
                  </div>
                </div>
              ))

            )}
          </div>
        )}
      </div>
    </>
  )

}

export default Tasks