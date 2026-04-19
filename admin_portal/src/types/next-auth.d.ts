import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth'{
    interface User{
        id?: string,
        userName?: string,
        email?: string,
        role?: string,
        portal?: string
    }
    interface Session{
        user: {
            id?: string,
            userName?: string,
            email?: string,
            role?: string
            portal?: string
        } & DefaultSession ['user']
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string,
        userName?: string
        email?: string,
        role?: string
        portal?: string
    }

}