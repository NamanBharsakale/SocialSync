import { FolderKanban, XIcon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { dummyPostsData, PLATFORMS } from "../assets/assets";
import api from "../api/axios";
import toast from "react-hot-toast";

interface Post {
  _id: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status: string;
}

function Schedular() {

  const [posts,setPosts] = useState<Post[]>(dummyPostsData);
  const [content,setContent] = useState("");
  const [scheduledDate,setScheduledDate] = useState("");
  const [scheduledTime,setScheduledTime] = useState("");
  const [selectedPlatforms,setSelectedPlatforms] = useState<string[]>([]);
  const [mediaFile,setMediaFile] = useState<File | null>(null);
  const [loading,setLoading] = useState(false);

  const fetchPosts = async ()=>{
    try{
      const {data} = await api.get("/api/posts")
      setPosts(data)
    }
    catch(error:any){
      toast.error(error?.response?.data?.message || error?.message )

    }
  }

  useEffect(()=>{
    (async ()=> await fetchPosts())();
    const interval = setInterval(async ()=>await fetchPosts(),1000 );
    return ()=>clearInterval(interval)
  },[])






  const scheduled = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p)=>p.status === "published")
  
  const togglePlatform = (id:string)=>{
    setSelectedPlatforms((prev)=>(prev.includes(id)?prev.filter((p)=>p!==id):[...prev,id]))
  }

  const handleSchedule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(selectedPlatforms.length === 0){
      toast.error("Select at least one platform");
      return;
    }
    if(!scheduledDate || !scheduledTime){
      toast.error("Select date and time");
      return;
    }

    if(selectedPlatforms.includes('instagram') &&!mediaFile ){
      toast.error("Instagram requires an image or video");
      return;
    }
    const scheduledFor = new Date(`${scheduledDate}${scheduledTime}`).toISOString();
    const formData = new FormData();
    formData.append("content",content);
    formData.append("scheduledFor",scheduledFor)
    formData.append("status","scheduled")
    formData.append("platforms",JSON.stringify(selectedPlatforms))

    if(mediaFile) formData.append("media",mediaFile);

    setLoading(true)
    try{
      await api.post("/api/posts",formData,{headers:{"Content-Type":"multipart/form-data"}})
      toast.success("Post Scheduled!")
      setContent("");
      setScheduledDate("");
      setScheduledTime("");
      setSelectedPlatforms([]);
      setMediaFile(null)
      fetchPosts();
    }
    catch(error:any){
      toast.error(error?.response?.data?.message || error.message)
    }
    finally{
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/**Compose Panle */}
      <div className="w-full lg:w-[460px] shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg text-slate-700">Compose Post</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSchedule}>
                {/**Platformms */}

                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-2">
                    Platforms
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map((p)=>{
                      const active = selectedPlatforms.includes(p.id);
                      return (
                        <button key={p.id} type="button" onClick={()=>togglePlatform(p.id)}
                        className={`flex items-center gap-1.5 p-3 rounded-md border transition-all duration-150 ${active ? "bg-red-50 border-red-300 text-red-500 scale-103":"border-slate-200 text-slate-500 hover:border-slate-300"}`} >
                          <p.icon className="size-4.5" />
                        </button>
                      )
                    })}
                  </div>
                </div>


                {/**Content */}
                    <div>
                      <label className="block text-xs text-slate-500 uppercase mb-2">
                        Content
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="What do you want to share today?"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 outline-none resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                      <div
                        className={`text-right text-xs mt-1 font-medium ${
                          content.length > 270 ? "text-red-500" : "text-slate-400"
                        }`}
                      >
                        {content.length}/280
                      </div>
                    </div>

                {/**Media upload */}
                    <div>
                      <label className="block text-xs text-slate-500 uppercase mb-2">
                        Media (optional)
                      </label>
                      {mediaFile ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          {mediaFile.type.startsWith("image/")
                           ?<img src={URL.createObjectURL(mediaFile)} 
                          alt="preview" className="w-full h-40 object-cover"/> 
                          : <video src={URL.createObjectURL(mediaFile)} className="w-full h-40 object-cover" 
                          controls/>}
                          <button onClick={()=>setMediaFile(null)} className="absolute top-2 right-2 size-7 bg-slate-900/60
                          hover:bg-slate-900/80 text-white rounded-full flex items-center
                          justify-center transition-colors"><XIcon className="size-3.5"/></button>
                        </div>
                      ):(
                        <label className="flex items-center justify-center gap-2 p-5 py-10 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group">
                          <span className="text-sm text-slate-500 group-hover:text-red-500 transition-colors">Click to upload image or video</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && setMediaFile(e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>

                {/**Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase mb-2">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                {/**Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-red-500 px-5 py-3 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Scheduling..." : "Schedule Post"}
                </button>

            </form>
        </div>

      </div>


      {/**Queue Panel */}
      <div className="flex-1">
        <div className="grid gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FolderKanban className="h-5 w-5 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Scheduled Posts</h3>
            </div>
            {scheduled.length === 0 ? (
              <p className="text-sm text-slate-500">No scheduled posts yet.</p>
            ) : (
              <ul className="space-y-3">
                {scheduled.map((post) => (
                  <li key={post._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-900">{post.content}</div>
                    <div className="text-xs text-slate-500">{post.scheduledFor}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FolderKanban className="h-5 w-5 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Published Posts</h3>
            </div>
            {published.length === 0 ? (
              <p className="text-sm text-slate-500">No published posts yet.</p>
            ) : (
              <ul className="space-y-3">
                {published.map((post) => (
                  <li key={post._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-900">{post.content}</div>
                    <div className="text-xs text-slate-500">{post.scheduledFor}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Schedular