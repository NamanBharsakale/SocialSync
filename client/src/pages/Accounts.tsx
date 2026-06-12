import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { PLATFORMS } from "../assets/assets"
import AccountList from "../components/AccountList"
import PlatformPickerModal from "../components/PlatformPickerModal";
import toast from "react-hot-toast";

interface Account {
  _id: string;
  handle: string;
  platform: string;
  status: string;
}

function Accounts() {

    const [accounts,setAccounts] = useState<Account[]>(dummyAccountsData)
    const [connecting,setConnecting] = useState<string | null>(null)
    const [showPlatformPicker,setShowPlatformPicker] = useState(false)

    const connectedIds = accounts.map((a) => a.platform)

    const fecthAccounts = async (isSync=false,platform?:string | null , successMsg?:string)=>{
        try{
            if(isSync){
                const label = platform?platform.charAt(0).toUpperCase()+platform.slice(1):
                "SocialMedia";
                toast.loading(`Syncing ${label} account...`,{id:"sync"});
                await api.get("/api/oauth/sync")
                toast.success(successMsg || "Accounts synced ",{id:"sync"})
            }

            const {data} = await api.get("/api/accounts")
            setAccounts(data)
        }catch(error:any){
            toast.error(error?.response?.data?.message || error ?.message || "Failed to load accounts");
        }
    }

    useEffect(()=>{
        const params = new URLSearchParams(window.location.search)
        const connectedPlatform = params.get("connected");
        const connectedUsername = params.get("username");
        const syncedNeeded = params.get("error");
        const errorMsg = params.get("error");

        window.history.replaceState({},document.title,window.location.pathname)
        
        if(connectedPlatform){
            const label = connectedPlatform.charAt(0).toLocaleLowerCase()+connectedPlatform.slice(1);
            const handle = connectedUsername ? `(@${connectedUsername})`:""
            fecthAccounts(true,connectedPlatforms,`${label}${handle} connected`)

        }
        else if(errorMsg){
            toast.error(`Connection failed: ${decodeURIComponent(errorMsg)}`)
            fetchAccounts();
        }
        else if(syncedNeeded){
            fectchAccounts(true,null,"Accounts synced"))
        }
        else{
            fetchAccounts()
        }
    
    
    
    })

    
    
    
    
    
    
    
    
    
    
    
    
    const handleConnect = async (platformId: string) => {
        setConnecting(platformId)
        try {
            const {data} = await api.get(`/api/oauth/${platformId}/url`);
            window.location.href = data.url;
        } catch (error:any) {
            toast.error(error?.response?.data?.message || error?.message || `Failed to connect ${platformId}` )
            setConnecting(null)
        }
        
    }

     const handleDisconnect= async (accountId: string)=>{

        try {
            await api.delete(`/api/accounts/${accountId}`)
            toast.success("Account disconnected")
            await fetchAccounts()
        } catch (error:any) {
           toast.error(error?.response?.data?.message || error?.message || `Failed to disconnect account` )

        }
    }
  return (
    <div className="space-y-8 max-w-4xl ">
        {/**Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between 
        gap-4 text-sm">
            <div>
                <h2 className="text-xl text-slate-900">Connected Accounts</h2>
                <p className="text-slate-500 text-sm mt-0.5">{accounts.length} of {PLATFORMS.length} platforms connected</p>
            </div>
            <button
            onClick={() => setShowPlatformPicker(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all w-full 
            sm:w-auto justify-center">
                <PlusIcon className="size-4" />Connect Account
            </button>
        </div>

        {/*Platform picker modal*/}
        {showPlatformPicker && (
          <PlatformPickerModal
            connectedIds={connectedIds}
            connecting={connecting}
            onClose={() => setShowPlatformPicker(false)}
            onConnect={handleConnect}
          />
        )}


        {/*Connected accounts list */}
        <AccountList accounts={accounts} onDisconnect={handleDisconnect}/>
        
    </div>
  )
}

export default Accounts