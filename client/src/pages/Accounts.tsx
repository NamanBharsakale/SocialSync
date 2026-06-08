import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { PLATFORMS } from "../assets/assets"

function Accounts() {

    const [accounts,setAccounts] = useState<any[]>([])
    const [connecting,setConnecting] = useState<string | null>(null)
    const [showPlatformPicker,setShowPlatformPicker] = useState(false)

  return (
    <div className="space-y-8 max-w-4xl ">
        {/**Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between 
        gap-4 text-sm">
            <div>
                <h2 className="text-xl text-slate-900">Connected Accounts</h2>
                <p className="text-slate-500 text-sm mt-0.5">{accounts.length} of {PLATFORMS.length} platforms connected</p>
            </div>
            <button onClick={()=>setShowPlatformPicker(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all w-full 
            sm:w-auto justify-center">
                <PlusIcon className="size-4" />Connect Account
            </button>
        </div>

        {/*Platform picker model*/}


        {/*Connected accounts list */}
        
    </div>
  )
}

export default Accounts