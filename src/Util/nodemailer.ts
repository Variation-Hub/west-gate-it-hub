const nodemailer = require('nodemailer');
const fs = require("fs");
const path = require("path");

const { SENDGRID_KEY } = process.env;

export async function EmailHelper(templateName: string, reciverEmail: string, creds: any) {
    try {

        const emailDetails = {
            to: reciverEmail,
            from: 'jasbir.singh@scaler.com', // Change to your verified sender
            subject: 'Welcome to our platform',
            text: `welcome to our platform ${creds.name}`,
            html: templateName,
        }
        const transportDetails = {
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: "apikey",
                pass: SENDGRID_KEY
            }
        }
        const transporter = nodemailer.createTransport(transportDetails);
        await transporter.sendMail((emailDetails))
        console.log("email sent")
    } catch (err) {
        console.log(err)
    }

}

const otpTemplate = (otp: string) => {
    return `
            <div>hello</div>
            <div>${otp}</div>
            `
}
