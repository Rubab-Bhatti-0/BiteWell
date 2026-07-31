import { 
  Settings, 
  X,
  LogOut 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose, activeMenu = 'Settings' }) {
  const navigate = useNavigate();
  
  // Dynamic user data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Dr. Sarah Miller';
  const clinicName = user.clinicName || 'Clinic Administrator';
  const initial = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SM';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Sidebar Menu Configuration
  const menuItems = [
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out
      lg:static lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div>
        {/* Sidebar Header / Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link to="/settings" className="flex items-center gap-2">
            <div className="bg-[#109FE3] text-white p-1.5 rounded-lg">
              {/* Tooth Logo Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2c-.17 0-.34.02-.5.06-1.52.38-2.5 1.76-2.5 3.44v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3c0-3.1 2.33-5.74 5.37-6.06.31-.03.63-.04.94-.04s.63.01.94.04C16.17 2.76 18.5 5.4 18.5 8.5v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3c0-1.68-.98-3.06-2.5-3.44-.16-.04-.33-.06-.5-.06z" opacity=".5"/>
                <path d="M12 22c4.42 0 8-3.58 8-8V8.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V11c0 .55-.45 1-1 1s-1-.45-1-1V8.5c0-.83-.67-1.5-1.5-1.5S12 7.67 12 8.5V11c0 .55-.45 1-1 1s-1-.45-1-1V8.5c0-.83-.67-1.5-1.5-1.5S7 7.67 7 8.5V14c0 4.42 3.58 8 8 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-md font-bold text-slate-900 tracking-tight leading-none">DentalPay</h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Dental Management</span>
            </div>
          </Link>
          
          {/* Close Mobile Sidebar Menu */}
          <button 
            onClick={onClose} 
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="px-4 py-2 space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={onClose}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive 
                    ? 'bg-[#46F1A8] text-slate-900 shadow-sm shadow-[#46F1A8]/20' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer User Profile */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A567D] to-[#00A3E1] flex items-center justify-center text-white font-bold text-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">{userName}</h4>
            <span className="text-[10px] text-slate-400 font-semibold truncate block">{clinicName}</span>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-rose-100 hover:border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}