import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';
export default function Signup() {
  const [formData, setFormData] = useState({

  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();  
    if (data.success === false) { 
      setError(data.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/signin');
    toast.success("Đăng ký thành công");
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Đăng ký</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type="text"
          name="username"
          placeholder="Username"
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
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
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
        <OAuth />
      </form>
      <div className='flex gap-2 mt-5 justify-center'>
        <p>Đã có tài khoản?</p>
        <Link to="/signin">
          <span className="hover:underline ">Đăng nhập</span>
        </Link>
      </div>
      {error && <p className='text-red-500'>{error}</p>}
    </div>
  );
}
