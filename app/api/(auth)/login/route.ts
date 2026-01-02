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
        const body = await req.json();

        const parsedUserData = userSchema.parse(body);

        if(!parsedUserData) return new NextResponse("Invalid input",{status : 400});

        const existingUser = await prisma.user.findUnique({
            where : {
                email : parsedUserData.email
            }
        });

        if(!existingUser) return new NextResponse("User Does not Exist" , {status : 404});

        if(existingUser.status === "BLOCKED") return new NextResponse("User is Blocked",{status : 403});

        const doesPasswordMatch = await bcrypt.compare(parsedUserData.password , existingUser.password);
        
        if(!doesPasswordMatch) return new NextResponse("Password Does Not Match" , {status : 403});


        const token = jwt.sign({id : existingUser.id ,email : parsedUserData.email} , "my_secret_key" , {expiresIn : '7d'});

        return NextResponse.json({
            message : "LoggedIn Successfully",
            token : token
        } , {status : 200});

    } catch(err : any) {
        return new NextResponse(err, {status : 500});
    }
}