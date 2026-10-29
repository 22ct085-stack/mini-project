import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import { readableError } from '../services/api';
import { signIn, signUp } from '../services/auth';
import { useAuth } from '../services/AuthContext';
import './login.css';

type Mode = 'login' | 'register';
export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/recommendations';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const account = mode === 'register' ? await signUp(name, email, password) : await signIn(email, password);
      setUser(account);
      navigate(returnPath, { replace: true });
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setLoading(false);
    }
  };

  return <><Navbar/><main className="auth-page">
    <section className="auth-card">
      <div className="auth-form-panel">
        <Link to="/" className="auth-back-link">← Back to exploring</Link>
        <span className="auth-mark"><Leaf size={19}/></span>
        <span className="eyebrow">YOUR S-CADE ACCOUNT</span>
        <h1>{mode === 'login' ? <>Welcome <em>back.</em></> : <>Join the <em>journey.</em></>}</h1>
        <p className="auth-intro">{mode === 'login' ? 'Sign in to continue with a more thoughtful way to travel.' : 'Create an account to make your S-CADE experience yours.'}</p>

        {user && <div className="auth-success" role="status">You’re signed in as {user.name}. <Link to="/recommendations">Explore recommendations <ArrowRight size={14}/></Link></div>}
        {error && <div className="auth-error" role="alert">{error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label className="auth-field"><span>Your name</span><div><UserRound size={16}/><input autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we call you?" required/></div></label>}
          <label className="auth-field"><span>Email address</span><div><Mail size={16}/><input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required/></div></label>
          <label className="auth-field"><span>Password</span><div><LockKeyhole size={16}/><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} required/><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          {mode === 'register' && <small className="auth-hint">Use at least 8 characters. Your password is stored as a salted hash.</small>}
          <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="auth-spinner"/> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></>}</button>
        </form>
        <p className="auth-switch">{mode === 'login' ? 'New to S-CADE?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      </div>
      <aside className="auth-aside"><div className="auth-landscape"><span className="auth-sun"/><span className="auth-hill auth-hill-back"/><span className="auth-hill auth-hill-front"/><span className="auth-art-label"><Leaf size={15}/> Go thoughtfully</span></div><span className="eyebrow">TRAVEL WITH INTENTION</span><h2>Make room for the places that stay with you.</h2><p>Your account gives your S-CADE journey a home. Explore nearby destinations, local businesses, and routes at your own pace.</p><div className="auth-aside-note"><span>01</span><span>Thoughtful choices start with knowing what matters to you.</span></div></aside>
    </section>
    <p className="auth-privacy">Your account details are used to sign you in to S-CADE. We never ask for your travel API keys.</p>
  </main><footer className="site-footer inner-footer"><Link className="brand" to="/"><span className="brand-icon"><Leaf size={16}/></span>S-CADE</Link><span><Link to="/about">About S-CADE</Link> · © 2026 S-CADE</span></footer></>;
}
