import { Link, NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  return <header className="site-header"><div className="nav-shell">
    <Link to="/" className="brand"><span className="brand-icon"><Leaf size={18}/></span><span>S-CADE</span></Link>
    <nav aria-label="Main navigation"><NavLink to="/" end>Discover</NavLink><NavLink to="/recommendations">Recommendations</NavLink><NavLink to="/businesses">Local businesses</NavLink><NavLink to="/ar">360° views</NavLink><NavLink to="/preferences">Preferences</NavLink><NavLink to="/about">About</NavLink></nav>
    {user ? <button className="nav-cta" type="button" onClick={() => void signOut()}>Sign out <span>↗</span></button> : <Link className="nav-cta" to="/login">Sign in <span>↗</span></Link>}
  </div></header>;
}
