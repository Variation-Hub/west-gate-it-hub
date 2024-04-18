const bcrypt = require('bcrypt');

export const comparepassword = async (Password: string, hashPassword: string) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(Password, hashPassword, (err: Error, result: string) => {
            if (err) {
                console.error('Error comparing passwords', err);
                reject(true);
            } else {
                resolve(result);
            }
        });
    });
};
