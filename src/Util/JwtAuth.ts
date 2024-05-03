import jwt from 'jsonwebtoken';

const secret = process.env.SECRET_KEY as string;

export const generateToken = (payload: any): any => {

    return jwt.sign(payload, secret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        await jwt.verify(token, secret, (err: any, decoded: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
}