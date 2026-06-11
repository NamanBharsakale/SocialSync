import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

//Helper to poll leonardo.ai
const pollLeonardoJob = async (generationId: string,apiKey:string):Promise<string>=>{
    const maxRetries = 20;
    const delay = 5000;


    for(let i ; i < maxRetries; i++){
        try {
            const response = await axios.get(`https://cloud.leonardo.ai/api/rest/v1/generations/{generationId}`,{headers:{
                accept: "application/json",authorization: `Bearer ${apiKey}`
            }})

            const generation = response.data.generations_by_pk;
            if(generation.status === "COMPLETE"){
                if(generation.generated_images && generation.generated_images.length > 0){
                    return generation.generated_images[0].url;
                }
                throw new Error("Generation complete but no images found.")
            }
            if(generation.status === "FAILED"){
                throw new Error("Leonardo.ai Generation failded.")

            }
        } catch (error) {
            
        }
    }
}




//Generate post
//POST /api/posts/generate
export const generatePost = async (req:AuthRequest,res:Response):Promise<void>=>{
    try{
        const {prompt,tone,generateImage} = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if(!apiKey){
            res.status(400).json({
                message:"GeminiAPI key is missing.Please add it in your server/.env file."
            });
            return;
        }
        const ai = new GoogleGenAI({apiKey});


        //Generate text
        const textResponse = await ai.models.generateContent({
            model:"gemini-2.5-flash",
            contents:`Generate a social media post based on this prompt : "${prompt}".
             Tone: ${tone}. 
             include relevant hashtags.
             Format the response as JSON with "content" and "imagePrompt" fields.
             The "imagePrompt" should be a highly descriptive prompt for an image generator that complements the post.`,
             
        });

        let content = "";

        let imagePrompt = prompt;

        try{
            const rawText = textResponse.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);

            const data = jsonMatch?JSON.parse(jsonMatch[0]):{
                content:rawText,
                imagePrompt:prompt
            };
            content = data.content;
            imagePrompt = data.imagePrompt;
        }
        catch(e){
            content = textResponse.text || ""
        }

        let mediaUrl = "";
        if(generateImage){
            try{
                const leonardoKey = process.env.LEONARDO_API_KEY;
                if(leonardoKey){
                    //use leonardo ai for image generaiton
                    const leoResponse = await axios.post(
                        "https://cloud.leonardo.ai/api/rest/v2/generations",
                        {
                            "public":false,
                            "model":"gpt-image-2",
                            "parameters":{
                                "quality":"LOW",
                                "prompt": imagePrompt,
                                "quantity":1,
                                "width":1024,
                                "height":1024,
                                "prompt_enhance":"OFF",
                            },

                        },{
                            headers:{
                                accept: "application/json",
                                authorization: `Bearer ${leonardoKey}`,
                                "content-type": "application/json",
                            }
                        }
                    )
                    const generationId = leoResponse.data.generate.generationId;
                    const tempUrl = await
                }

            }
            catch(error){

            }
        }
    }
    catch(error){

    }
}

//Get generatiosn
//GET /api/posts/generations
export const getGenerations = async (req:AuthRequest,res:Response):Promise<void>=>{

}

//Get post
//GET /api/posts
export const getPosts = async (req:AuthRequest,res:Response):Promise<void>=>{

}


//Schedule post
//GET /api/posts
export const schedulePost = async (req:AuthRequest,res:Response):Promise<void>=>{

}