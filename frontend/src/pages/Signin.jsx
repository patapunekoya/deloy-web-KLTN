import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector  } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/userSlice.js';
import OAuth from '../components/OAuth';

export default function Signin() {
  const [formData, setFormData] = useState({

  });

  const {loading, error} = useSelector((state) => state.user);
  const navigate = useNavigate(); 
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       dispatch(signInStart());
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();  
    if (data.success === false) { 
      dispatch(signInFailure(data.message));
      return;
    }
    dispatch(signInSuccess(data));
    navigate('/');
    toast.success("Đăng nhập thành công");
    } catch (error) { 
      dispatch(signInFailure(error.message));
    }
  };

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Đăng nhập</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
        <button disabled={loading} type="submit" className='uppercase bg-slate-700 text-white p-3 rounded-lg'>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        <OAuth />
      </form>
      <div className='flex gap-2 mt-5 justify-center'>
        <p>Chưa có tài khoản?</p>
        <Link to="/signup">
          <span className="hover:underline ">Đăng ký</span>
        </Link>
      </div>
      {error && <p className='text-red-500'>{error}</p>}
    </div>
  );
}
