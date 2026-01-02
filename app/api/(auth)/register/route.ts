import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import * as z from 'zod';

const userSchema = z.object({
                    email : z.email().min(1,"Email Cannot Be Empty"),
                    password : z.string().min(8,"Password should be min 8 words")
                });

export async function POST (req : Request) {
    try {
        const body  = await req.json();

        const parsedUserData = userSchema.parse(body);

        if(!parsedUserData) {
            return new NextResponse("Incorrect User Body", { status: 400 });
        }

        console.log(parsedUserData.email , parsedUserData.password);

        const existingUser = await prisma.user.findUnique({
            where : {
                email : parsedUserData.email
            }
        });

        if(existingUser) return new NextResponse("User Already Exists" , {status : 409});
        
        const hashedPassword =await bcrypt.hash(parsedUserData.password,10);

        const createdUserDetails = await prisma.user.create({
            data : {
                email : parsedUserData.email,
                password : hashedPassword
            }
        });
        // TODO :- Moving secret key to env variable
        const token = jwt.sign({id : createdUserDetails.id , email : parsedUserData.email},"my_secret_key",{expiresIn:'7d'});

        return NextResponse.json({
            message : "User created successfully",
            token : token
        }, {status : 200});
        

    } catch(err : any) {
        return new NextResponse(err, {status : 500});
    }
}