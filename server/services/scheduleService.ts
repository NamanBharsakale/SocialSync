import cron from 'node-cron'
import { Post } from '../model/Posts.js';
import { Account } from '../model/Account.js';
import zernio from '../config/zernio.js';
import { ActivityLog } from '../model/ActivityLog.js';
export const initScheduler = ()=>{
    cron.schedule("* * * * * *",async()=>{
        try{
            const now = new Date();
            // Atomically claim posts by moving them to "processing" so concurrent
            // ticks never double-publish the same post.
            const postsToPublish = await Post.find({status:"scheduled",scheduledFor: {$lte:now}});
            for (const p of postsToPublish){
                await Post.updateOne({_id:p._id,status:"scheduled"},{$set:{status:"processing"}});
            }
            const claimedIds = postsToPublish.map(p=>p._id);
            const claimed = await Post.find({_id:{$in:claimedIds},status:"processing"});

            for (const post of claimed){
                try {
                   const accounts = await Account.find({
                    user:post.user,
                    platform: {$in: post.platforms},
                    status: "connected",
                    zernioAccountId: {$exists: true}
                   })


                   if(accounts.length === 0){
                        console.log(`No connected Zernio accounts found for post ${post._id}`);
                        post.status = "failed";
                        await post.save();
                        continue;
                   }

                   const zernioPlatforms = accounts.map((acc)=>({
                        platform: acc.platform as any,
                        accountId: acc.zernioAccountId!
                   }))

                   const payload = {
                    content: post.content,
                    publishNow:true,
                    ...(post.mediaUrl ? {mediaItems: [{type: post.mediaType || "image", url: post.mediaUrl}]} : {}),
                    platforms:zernioPlatforms,
                }
                console.log(`Publishing post ${post._id} to zernio with media: ${post.mediaUrl || "none"}`)

                const response = await zernio.posts.createPost({
                    body:payload
                })

                const publishedPost = (response.data as any)?.post || response.data;

                if(!publishedPost){
                    throw new Error("Failed to get post object from Zernio response");
                }

                console.log(`Zernio post created : ${publishedPost._id || publishedPost.id}`);

                post.status = "published";
                await post.save();


                await ActivityLog.create({
                    user: post.user,
                    actionType: "POST_PUBLISHED",
                    description: `Published post to ${accounts.map((a)=>a.platform).join(",")}`,
                    relatedPost:post._id
                })
                } catch (error:any) {
                      console.error(`Failed to publish post ${post._id} : `,error?.response?.data || error?.message);
                      post.status = "failed";
                      await post.save()
        
                }
            }
            if(claimed.length > 0){
                console.log(`Evaluated ${claimed.length} posts at ${now.toISOString()}`);
            }
        }
        catch(error:any){
          console.error("Error in schedular: ",error);
        }
    })
    console.log("Schedular service initialised. ")
}