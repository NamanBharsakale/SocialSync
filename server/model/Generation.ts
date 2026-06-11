import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
    
},{timestamps:true})

export const Account = mongoose.model("Account",generationSchema)