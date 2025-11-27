import { Request as ExpressRequest } from 'express';

export interface CustomRequest extends ExpressRequest {
    token: {
        user_id: string,
        user_name: string,
        email: string,
        role: string
    },
    user: any,
    tokenrole: string
}
