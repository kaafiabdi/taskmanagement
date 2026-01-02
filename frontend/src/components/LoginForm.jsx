import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import validateManyFields from '../validations';
import Input from './utils/Input';
import { useDispatch, useSelector } from "react-redux";
import { postLoginData } from '../redux/actions/authActions';
import Loader from './utils/Loader';
import { useEffect } from 'react';

const LoginForm = ({ redirectUrl }) => {

  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();

  const authState = useSelector(state => state.authReducer);
  const { loading, isLoggedIn } = authState;
  const dispatch = useDispatch();


  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectUrl || "/");
    }
  }, [authState, redirectUrl, isLoggedIn, navigate]);



  const handleChange = e => {
    setFormData({
      ...formData, [e.target.name]: e.target.value
    });
  }

  const handleSubmit = e => {
    e.preventDefault();
    const errors = validateManyFields("login", formData);
    setFormErrors({});
    if (errors.length > 0) {
      setFormErrors(errors.reduce((total, ob) => ({ ...total, [ob.field]: ob.err }), {}));
      return;
    }
    dispatch(postLoginData(formData.email, formData.password));
  }



  const fieldError = (field) => (
    <p className={`mt-1 text-pink-600 text-sm ${formErrors[field] ? "block" : "hidden"}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="inline w-4 h-4 mr-2 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z"/></svg>
      {formErrors[field]}
    </p>
  )

  return (
    <>
      <div className='w-full max-w-md'>
        <form className='bg-white shadow-lg rounded-xl p-8 border border-gray-100' onSubmit={handleSubmit}>
          {loading ? <Loader /> : (
            <>
              <div>
                <div className='auth-logo'>maskaxwadaag</div>
                <h2 className='text-center text-2xl font-semibold mb-2 text-gray-800'>Welcome back</h2>
              </div>
              <p className='text-center text-sm text-gray-500 mb-6'>Sign in to the Maskax Wadaag team to manage your tasks.</p>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="text" name="email" id="email" value={formData.email} placeholder="you@company.com" onChange={handleChange} />
                {fieldError("email")}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <Input type="password" name="password" id="password" value={formData.password} placeholder="Your password" onChange={handleChange} />
                {fieldError("password")}
              </div>

              <button type='submit' className='w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium transition'>Sign in</button>

              <div className='pt-4 text-center'>
                <Link to="/signup" className='text-indigo-600 hover:underline text-sm'>Don't have an account? Create one</Link>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  )
}

export default LoginForm