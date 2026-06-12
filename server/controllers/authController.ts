
import { Request,Response } from "express";
import bcrypt from "bcrypt"
import { User } from "../model/User.js";
import jwt from "jsonwebtoken";

const generateToken=(id:string)=>{
    const jwtSecret = process.env.JWT_SECRET;
    if(!jwtSecret){
        throw new Error("JWT_SECRET environment variable is not set");
    }
    return jwt.sign({id},jwtSecret,{expiresIn: '30d'})
}



//Register user
//Post /api/auth/register
export const registerUser = async (req:Request,res:Response):
 Promise<void>=>{
    try{
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            res.status(400).json({message:"Name, email, and password are required"})
            return;
        }
        const userExists = await User.findOne({email})
        if(userExists){
            res.status(400).json({message:"User already exists"})
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const user = await User.create({name,email,password:hashedPassword});
        if(user){
            res.status(201).json({_id:user._id,name:user.name,email:user.email,token:generateToken(user._id.toString()) })
        }
        else{
            res.status(400).json({message: "Invalid user data"})
        }
    }
    catch(error:any){
        res.status(500).json({message:error?.message || "Invalid user data"})
    }
}



//login

export const loginUser = async (req:Request,res:Response):
 Promise<void>=>{
    try{
        const {email,password} = req.body;
        if(!email || !password){
            res.status(400).json({message:"Email and password are required"})
            return;
        }
        const user = await User.findOne({email})
        if(user && (await bcrypt.compare(password,user.password)) ){
            res.json({_id:user._id,name:user.name,email:user.email})
        }
        else{
            res.status(401).json({message: "invalid email or psw"})
        }
    }
    catch(error:any){
        res.status(500).json({message:error?.message || "Invalid user data"})
    }
}
