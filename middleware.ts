import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken';

 

interface UserProps {
    id : string,
    email : string , 
    iat : Number,
    exp : Number
}

export async function middleware(request: NextRequest) {

    // if(['/api/login','/api/register'].includes(request.nextUrl.pathname)){
    //     return NextResponse.next();
    // }

    const bearerToken =  request.headers.get("authorization");
    const [type,token] = bearerToken?.split(" ")!;
    
    if(type !== "Bearer" || !token) return new NextResponse("Request Header type mismatch",{
        status : 400
    });

    const payload = jwt.verify(token, "my_secret_key") as unknown as UserProps;

    const requestHeaders = new Headers(request.headers);

    requestHeaders.set('x-user-email',payload.email);
    requestHeaders.set('x-user-id',payload.id);
    console.log(payload);
    return NextResponse.next({
        request : {
            headers : requestHeaders
        }
    })    
}
 
// Supports both a single string value or an array of matchers
export const config = {
  matcher: ['/api/:path*'],
}

export const runtime = "nodejs";
