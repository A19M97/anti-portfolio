import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  const user = await currentUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const existingUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    })

    if (existingUser) {
      return NextResponse.json({
        user: existingUser,
        created: false,
      })
    }

    const newUser = await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      },
    })

    return NextResponse.json({
      user: newUser,
      created: true,
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
