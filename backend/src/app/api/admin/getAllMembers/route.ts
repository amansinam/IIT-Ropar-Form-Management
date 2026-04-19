import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";



export async function GET(req: NextRequest){
    try {
        // Check that the admin is logged in or not.
        const session = await getServerSession(authOptions)

        if(!session || session.user?.role!=="Admin"){
            return NextResponse.json({
                success: false,
                message: "Admin is not logged in"
            },{status: 400})
        }

        const allVerifiersList = await prisma.verifier.findMany()

        return NextResponse.json({
            success: true,
            message: "Verifiers List fetched successfully",
            data: allVerifiersList
        })

    } catch (error:any) {
        console.log(error)
        return NextResponse.json({
            success: false,
            message: error.message
        },{status: 500})
        
    }
}