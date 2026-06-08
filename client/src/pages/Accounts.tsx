import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { dummyAccountsData, PLATFORMS } from "../assets/assets"
import AccountList from "../components/AccountList"

interface Account {
  _id: string;
  handle: string;
  platform: string;
  status: string;
}

function Accounts() {

    const [accounts,setAccounts] = useState<Account[]>(dummyAccountsData)

     const handleDisconnect= async (accountId: string)=>{
        setAccounts(accounts.filter((a)=>a._id!==accountId))

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
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all w-full 
            sm:w-auto justify-center">
                <PlusIcon className="size-4" />Connect Account
            </button>
        </div>

        {/*Platform picker model*/}


        {/*Connected accounts list */}
        <AccountList accounts={accounts} onDisconnect={handleDisconnect}/>
        
    </div>
  )
}

export default Accounts