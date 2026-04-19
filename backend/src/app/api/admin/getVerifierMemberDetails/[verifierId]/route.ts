import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ verifierId: string }> }
) {
    try {
        const { verifierId } = await params;

        // Check that verifier exist in database. 
        const verifier = await prisma.verifier.findFirst({
            where:{
                id: verifierId
            }
        })

        return NextResponse.json({
            success: true,
            message: "Verifier fetched successfully",
            data: verifier
        })
        
    } catch (error:any) {
        console.log(error)

        return NextResponse.json({
            success: false,
            message: error.message
        },{status: 500})
        
    }
}