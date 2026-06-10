import { CalendarDaysIcon, LayoutDashboardIcon, UsersIcon, Wand2Icon, UserIcon, LogOutIcon } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

function SideBar({isOpen,setIsOpen}:{isOpen:boolean, setIsOpen: (val:boolean)=>void}) {
  
  // NOTE: No auth provider/hook found in this repo. If you have an auth hook (e.g. useAuth()),
  // replace this mock with: const { logout, user } = useAuth()
  const navigate = useNavigate()
  const logout = () => {
    // perform client-side navigation to sign-out route/home
    navigate('/', { replace: true })
  }
  const user = { name: 'John Doe', email: 'johndoe@gmail.com' }


  const location = useLocation();
  const navItems = [
    {name:"Dashboard", icon: LayoutDashboardIcon, path:"/dashboard"},
    {name:"Accounts",icon: UsersIcon, path: "/accounts"},
    {name:"Scheduler", icon:CalendarDaysIcon, path:"/schedule"},
    {name: "AI Composer", icon: Wand2Icon,path:"/ai-composer"}
  ]
  
  
  
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
    flex flex-col h-full transform transition-transform duration-200 ease-in-out
    md:relative md:translate-x-0 ${isOpen ? "translate-x-0":"-translate-x-full"}`}>
      {/* logo */}
      <div className="p-6 pb-4">
        <div className='flex items-center gap-2 text-slate-900 font-semibold'>
          <img src='/logo.svg' alt='logo' className='h-6 w-6' />
          <span>SocialSync</span>
        </div>
      </div>
      {/**Nva secion label */}
      <div>
        <span className='text-xs text-slate-500 uppercase tracking-wider'>Menu</span>
      </div>
      {/**Nva links */}
      <nav className='flex-1 px-3 space-y-1'>
      {navItems.map((item)=>{
        const isActive = location.pathname===item.path;

        return (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/dashboard"}
            onClick={()=>setIsOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-slate-100 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? 'text-red-500' : 'text-slate-500'}`} />
            <span>{item.name}</span>
            {isActive && <span className='ml-auto h-5 w-1 rounded-full bg-red-500' />}
          </NavLink>
        )
      })}
      </nav>
      {/**User Footer */}
      <div className='mt-auto p-4 border-t border-slate-100'>
        <div className='flex items-center gap-3 rounded-3xl bg-slate-50 p-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-700'>
            <UserIcon className='h-5 w-5' />
          </div>
          <div className='min-w-0'>
            <div className='text-sm font-semibold text-slate-900'>
              {user?.name ?? 'John Doe'}
            </div>
            <div className='truncate text-xs text-slate-500'>
              {user?.email ?? 'johndoe@gmail.com'}
            </div>
          </div>
        </div>
        <button
          type='button'
          onClick={logout}
          className='mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
        >
          <LogOutIcon className='h-4 w-4' />
          Logout
        </button>
      </div>
    </div>
  )
}

export default SideBar