import crypto from "crypto";
import { Request,Response } from "express";
import bcrypt from "bcrypt"
import { User } from "../model/User.js";
import jwt from "jsonwebtoken";
import transporter from "../config/mailer.js";

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
            res.json({_id:user._id,name:user.name,email:user.email,token:generateToken(user._id.toString())})
        }
        else{
            res.status(401).json({message: "invalid email or psw"})
        }
    }
    catch(error:any){
        res.status(500).json({message:error?.message || "Invalid user data"})
    }
}


// Forgot password — send reset link
// POST /api/auth/forgot-password
export const forgotPassword = async (req:Request,res:Response):Promise<void>=>{
    try{
        const {email} = req.body;
        if(!email){
            res.status(400).json({message:"Email is required"});
            return;
        }

        const user = await User.findOne({email});

        // Always respond the same way to prevent email enumeration
        if(!user){
            res.json({message:"If that email exists, a reset link has been sent."});
            return;
        }

        // Throttle: block re-send if a valid token was issued less than 60 s ago
        if(
            user.resetPasswordExpires &&
            user.resetPasswordExpires.getTime() - Date.now() > 59 * 60 * 1000
        ){
            res.status(429).json({message:"A reset link was already sent. Please wait 60 seconds before requesting another."});
            return;
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        // Use a trusted env var — never the caller-supplied Origin header,
        // which an attacker can forge to redirect reset links to their own domain.
        const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientOrigin}/reset-password/${rawToken}`;

        // Send email BEFORE persisting the token. If the mailer fails, the
        // throttle window is never armed so the user can retry immediately.
        await transporter.sendMail({
            from: `"SocialSync" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Reset your SocialSync password",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto">
                    <h2>Password Reset</h2>
                    <p>Hi ${user.name},</p>
                    <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                    <a href="${resetUrl}"
                       style="display:inline-block;margin:16px 0;padding:12px 24px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
                        Reset Password
                    </a>
                    <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                    <p style="color:#9ca3af;font-size:12px">This link will expire in 1 hour.</p>
                </div>
            `,
        });

        // Persist only after the email is confirmed sent so a mailer failure
        // does not arm the 1-hour throttle window on the user's account.
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        res.json({message:"If that email exists, a reset link has been sent."});
    }
    catch(error:any){
        console.error("forgotPassword error:", error?.message);
        res.status(500).json({message:"Failed to send reset email. Please try again."});
    }
}


// Reset password — consume token and update password
// POST /api/auth/reset-password/:token
export const resetPassword = async (req:Request,res:Response):Promise<void>=>{
    try{
        const {token} = req.params;
        const {password} = req.body;

        if(!password || password.length < 6){
            res.status(400).json({message:"Password must be at least 6 characters"});
            return;
        }

        const hashedToken = crypto.createHash("sha256").update(String(req.params.token)).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {$gt: new Date()},
        });

        if(!user){
            res.status(400).json({message:"Reset link is invalid or has expired"});
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({message:"Password updated successfully. You can now sign in."});
    }
    catch(error:any){
        res.status(500).json({message:error?.message || "Server error"});
    }
}
