// 2.1, 2.2, 2.3, 2.4, 2.5 + flash message support
import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); // from AuthContext

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.msg || '');

  // Clear router state so flash doesn't persist on refresh/back
  useEffect(() => {
    if (location.state?.msg) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const errors = useMemo(() => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  }, [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const showError = (name) => (submitAttempted || touched[name]) && errors[name];

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setOk(''); setError('');
    if (hasErrors) return;

    try {
      setSubmitting(true);
      const res = await axiosInstance.post('/api/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const { token, user } = res.data || {};
      if (!token) throw new Error('No token returned');

      // 2.4: store token & user, set header, persist (handled by AuthContext)
      login(token, user);

      // 2.5: redirect based on systemRole
      if (user.systemRole === 'admin') {
        navigate('/employees', { replace: true }); // admin dashboard
      } else {
        navigate('/profile', { replace: true });   // employee profile
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 400) setError(msg || 'Invalid credentials.');
      else setError(msg || 'Login failed. Please try again.');
      console.error('Login failed:', status, err?.response?.data || err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return(
<div style={{width: 1440, height: 1024, position: 'relative', background: 'linear-gradient(180deg, #5598A2 0%, #4BA8FA 100%)', overflow: 'hidden'}}>
  <div style={{width: 1440, height: 85, left: 0, top: 0, position: 'absolute', overflow: 'hidden'}}>
    <div style={{width: 1440, height: 85, left: 0, top: 0, position: 'absolute', background: 'linear-gradient(90deg, #239FC1 0%, #20228C 100%)'}} />
    <div style={{left: 35, top: 21, position: 'absolute', color: 'white', fontSize: 36, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word'}}>Leave&Shift Management</div>
    <div style={{width: 336, height: 65, paddingTop: 13, paddingBottom: 10, paddingLeft: 10, paddingRight: 10, left: 1052, top: 13, position: 'absolute'}} />
    <div style={{width: 383, height: 33, left: 1028, top: 23, position: 'absolute', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 8, display: 'inline-flex', flexWrap: 'wrap', alignContent: 'flex-start'}}>
      <div data-state="Active" style={{padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex'}}>
        <div style={{justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#FFF8F8', fontSize: 22, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 28, wordWrap: 'break-word'}}>Home</div>
      </div>
      <div data-state="Default" style={{padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex'}}>
        <div style={{justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: 20, fontFamily: 'Inter', fontWeight: '400', lineHeight: 24, wordWrap: 'break-word'}}>leaves</div>
      </div>
      <div data-state="Default" style={{padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex'}}>
        <div style={{justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: 20, fontFamily: 'Inter', fontWeight: '400', lineHeight: 24, wordWrap: 'break-word'}}>Shifts</div>
      </div>
      <div data-state="Default" style={{padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex'}}>
        <div style={{justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: 20, fontFamily: 'Inter', fontWeight: '400', lineHeight: 24, wordWrap: 'break-word'}}>My Profile</div>
      </div>
    </div>
  </div>
  <div style={{width: 1074, height: 840, left: 159, top: 78, position: 'absolute'}}>
    <div style={{width: 452, height: 408, left: 311, top: 125, position: 'absolute', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 30, display: 'inline-flex'}}>
      <div style={{width: 262, height: 124, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 21, display: 'flex'}}>
        <div style={{width: 134, height: 86, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: 40, fontFamily: 'Inknut Antiqua', fontWeight: '500', lineHeight: 24, wordWrap: 'break-word'}}>Log in</div>
      </div>
      <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'flex'}}>
        <div style={{alignSelf: 'stretch', height: 126, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, display: 'flex'}}>
          <div style={{width: 423, height: 103, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Miscellaneous-Segmented-Control---Selected-Fill, white)', fontSize: 40, fontFamily: 'Inknut Antiqua', fontWeight: '500', lineHeight: 24, wordWrap: 'break-word'}}>Welcome Back!</div>
        </div>
      </div>
      <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'flex'}}>
        <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex'}}>
          <div style={{alignSelf: 'stretch', paddingLeft: 14, paddingRight: 14, paddingTop: 16, paddingBottom: 16, position: 'relative', background: 'white', borderRadius: 16, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'flex'}}>
            <div data-svg-wrapper>
              <svg width="7" height="10" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.61264 5C1.61264 6.06087 1.80087 7.07828 2.13591 7.82843C2.47096 8.57857 2.92538 9 3.3992 9C3.87303 9 4.32745 8.57857 4.66249 7.82843C4.99754 7.07828 5.18576 6.06087 5.18576 5C5.18576 3.93913 4.99754 2.92172 4.66249 2.17157C4.32745 1.42143 3.87303 1 3.3992 1C2.92538 1 2.47096 1.42143 2.13591 2.17157C1.80087 2.92172 1.61264 3.93913 1.61264 5Z" stroke="#B2B0B0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div data-svg-wrapper>
              <svg width="9" height="8" viewBox="0 0 9 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.71936 7V5C1.71936 3.93913 1.90759 2.92172 2.24263 2.17157C2.57768 1.42143 3.0321 1 3.50592 1H5.29248C5.76631 1 6.22073 1.42143 6.55577 2.17157C6.89082 2.92172 7.07904 3.93913 7.07904 5V7"/>
              <path d="M1.71936 7V5C1.71936 3.93913 1.90759 2.92172 2.24263 2.17157C2.57768 1.42143 3.0321 1 3.50592 1H5.29248C5.76631 1 6.22073 1.42143 6.55577 2.17157C6.89082 2.92172 7.07904 3.93913 7.07904 5V7" stroke="#B2B0B0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div style={{width: 268, left: 45, top: 19, position: 'absolute', color: '#667085', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word'}}>Username</div>
          </div>
          <div style={{alignSelf: 'stretch', paddingLeft: 14, paddingRight: 14, paddingTop: 16, paddingBottom: 16, background: 'white', borderRadius: 16, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'flex'}}>
            <div style={{alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex'}}>
              <div data-svg-wrapper style={{position: 'relative'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.75 9.05811V7C16.75 4.38 14.62 2.25 12 2.25C9.38 2.25 7.25 4.38 7.25 7V9.05811C5.752 9.29111 5 10.269 5 12V18C5 20 6 21 8 21H16C18 21 19 20 19 18V12C19 10.269 18.248 9.29111 16.75 9.05811ZM12.75 14.9871V17C12.75 17.414 12.414 17.75 12 17.75C11.586 17.75 11.25 17.414 11.25 17V14.9619C10.962 14.7329 10.7649 14.395 10.7649 14C10.7649 13.31 11.32 12.75 12.01 12.75H12.02C12.71 12.75 13.27 13.31 13.27 14C13.27 14.412 13.057 14.7601 12.75 14.9871ZM15.25 9H8.75V7C8.75 5.21 10.21 3.75 12 3.75C13.79 3.75 15.25 5.21 15.25 7V9Z" fill="#C3C3C3"/>
                </svg>
              </div>
              <div style={{width: 268, color: '#667085', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word'}}>Password</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style={{width: 452, paddingLeft: 14, paddingRight: 14, paddingTop: 16, paddingBottom: 16, left: 311, top: 685, position: 'absolute', background: 'white', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.88)', borderRadius: 16, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex'}}>
      <div style={{alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'inline-flex'}}>
        <div style={{color: 'black', fontSize: 32, fontFamily: 'Judson', fontWeight: '400', wordWrap: 'break-word'}}>LOG IN</div>
      </div>
    </div>
    <div style={{left: 346, top: 602, position: 'absolute', justifyContent: 'flex-start', alignItems: 'center', gap: 4, display: 'inline-flex'}}>
      <div style={{color: '#202122', fontSize: 20, fontFamily: 'Inter', fontWeight: '500', lineHeight: 14, wordWrap: 'break-word'}}>Don’t have an account?</div>
      <div data-svg-wrapper style={{position: 'relative'}}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.11713 1.5431L5.84355 1.81668C5.77485 1.88538 5.77485 1.99677 5.84355 2.06547L8.40873 4.63056H0.425919C0.328762 4.63056 0.25 4.70932 0.25 4.80648V5.19346C0.25 5.29061 0.328762 5.36938 0.425919 5.36938H8.40873L5.84355 7.93456C5.77485 8.00326 5.77485 8.11464 5.84355 8.18334L6.11713 8.45692C6.18583 8.52562 6.29721 8.52562 6.36591 8.45692L9.69847 5.12436C9.76717 5.05566 9.76717 4.94428 9.69847 4.87557L6.36591 1.5431C6.29721 1.4744 6.18583 1.4744 6.11713 1.5431Z" fill="#A421A7"/>
        </svg>
      </div>
      <div style={{color: 'white', fontSize: 20, fontFamily: 'Inter', fontWeight: '500', lineHeight: 14, wordWrap: 'break-word'}}>Register</div>
    </div>
  </div>
</div>
);
}