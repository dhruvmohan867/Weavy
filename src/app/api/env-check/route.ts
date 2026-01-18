import { NextResponse } from "next/server";

export async function GET() {
  console.log("✅ ENV CHECK:");
  console.log("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  console.log("CLERK_SECRET_KEY exists? =", !!process.env.CLERK_SECRET_KEY);
  console.log("DATABASE_URL exists? =", !!process.env.DATABASE_URL);

  return NextResponse.json({
    publishableKeyExists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretExists: !!process.env.CLERK_SECRET_KEY,
    databaseUrlExists: !!process.env.DATABASE_URL,
  });
}
