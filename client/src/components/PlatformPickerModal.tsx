import { CheckCircleIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { PLATFORMS } from '../assets/assets';


interface PlatformPickerModalProps{
    connectedIds: string[];
    connecting:string | null;
    onClose: ()=> void;
    onConnect: (platformId: string) => void;
}
function PlatformPickerModal({connectedIds,connecting,onClose,onConnect}:PlatformPickerModalProps) {
  return (
    <div
    className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 
    backdrop-blur'>
        <div className='bg-white rounded-2xl shadow-2xl  max-w-md border border-slate-100'>
            {/**Header */}
            <div className='flex items-center justify-between px-6 py-4 shadow'>
                <h3 className='text-slate-700'>
                    Choose a Platform
                </h3>
                <button
                type='button'
                onClick={onClose} 
                className='p-2 rounded-full hover:bg-slate-100 text-slate-500
                transition-colors'>
                    <XIcon className='size-4' />
                </button>
            </div>

            {/**Platform list */}
            <div className='p-6 flex flex-col gap-3'>
                {PLATFORMS.map((p)=>{
                    const isConnected = connectedIds.includes(p.id);
                    const isConnecting = connecting === p.id;
                    const Icon = p.icon;
                    return(
                        <button
                          key={p.id}
                          type='button'
                          onClick={() => !isConnected && onConnect(p.id)}
                          disabled={isConnected || Boolean(connecting)}
                          className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${isConnected ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white hover:border-slate-300'} disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                            {/**icon */}
                            <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100'>
                                <Icon className={`size-5 ${isConnected ? 'text-red-600' : 'text-slate-500'}`} />
                            </div>

                            {/**label */}
                            <div className='flex-1 min-w-0'>
                                    <div className={`text-sm font-medium ${isConnected ? 'text-red-700' : 'text-slate-800'}`}>
                                        {p.name}
                                    </div>
                                    <div className='text-xs text-slate-500 truncate'>
                                        {isConnected ? 'Already connected' : p.description}
                                    </div>
                            </div>

                            {isConnected ? (
                              <CheckCircleIcon className='size-4 text-red-500 shrink-0' />
                            ) : isConnecting ? (
                              <div className='h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-slate-500' />
                            ) : (
                              <ExternalLinkIcon className='size-4 text-slate-400 shrink-0' />
                            )}

                        </button>

                    )
                })}
            </div>
        </div>

    </div>
  )
}

export default PlatformPickerModal