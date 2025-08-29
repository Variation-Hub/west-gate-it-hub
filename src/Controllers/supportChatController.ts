import { Request, Response } from "express";
import supportChatModel from "../Models/supportChatModel";
import { sendSupportMessageToUser } from "../socket/socketEvent";
import { sendMailForSupportChat } from "../Util/nodemailer";
import { userRoles } from "../Util/contant";
import userModel from "../Models/userModel";
import { v4 as uuidv4 } from 'uuid';

// Predefined messages for the chat flow
const PREDEFINED_MESSAGES = {
    initial: "Hi! 👋 Welcome to our support chat. How can I help you today?",
    askName: "What is your name?",
    askEmail: "Please enter your email address:",
    askQuestion: "Please describe your question or issue:",
    thankYou: "Thank you! Your message has been sent to our support team. We'll get back to you soon.",
    invalidInput: "I didn't understand that. Please try again."
};

export const startSupportChat = async (req: Request, res: Response) => {
    try {
        const { userId, anonymousUserId } = req.body;
        
        // Generate unique session ID
        const sessionId = uuidv4();
        
        // Create new chat session
        const chatSession = await supportChatModel.create({
            sessionId,
            userId: userId || null,
            anonymousUserId: anonymousUserId || null,
            messages: [{
                message: PREDEFINED_MESSAGES.initial,
                isUser: false,
                timestamp: new Date()
            }]
        });

        return res.status(200).json({
            message: "Support chat started successfully",
            status: true,
            data: {
                sessionId: chatSession.sessionId,
                messages: chatSession.messages,
                currentStep: chatSession.currentStep
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const sendSupportMessage = async (req: Request, res: Response) => {
    try {
        const { sessionId, message, userId, anonymousUserId } = req.body;
        
        // Find the chat session
        const chatSession = await supportChatModel.findOne({ sessionId, isActive: true });
        
        if (!chatSession) {
            return res.status(404).json({
                message: "Chat session not found",
                status: false,
                data: null
            });
        }

        // Add user message to chat
        chatSession.messages.push({
            message,
            isUser: true,
            timestamp: new Date()
        });

        let botResponse = "";
        let nextStep = chatSession.currentStep;

        // Handle the conversation flow based on current step
        switch (chatSession.currentStep) {
            case 'initial':
                if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello') || message.toLowerCase().includes('hey')) {
                    botResponse = PREDEFINED_MESSAGES.askName;
                    nextStep = 'name';
                } else {
                    botResponse = PREDEFINED_MESSAGES.invalidInput;
                }
                break;

            case 'name':
                if (message.trim().length > 0) {
                    chatSession.userName = message.trim();
                    botResponse = PREDEFINED_MESSAGES.askEmail;
                    nextStep = 'email';
                } else {
                    botResponse = PREDEFINED_MESSAGES.invalidInput;
                }
                break;

            case 'email':
                if (message.trim().length > 0 && message.includes('@')) {
                    chatSession.userEmail = message.trim();
                    botResponse = PREDEFINED_MESSAGES.askQuestion;
                    nextStep = 'question';
                } else {
                    botResponse = "Please enter a valid email address:";
                }
                break;

            case 'question':
                if (message.trim().length > 0) {
                    chatSession.userQuestion = message.trim();
                    botResponse = PREDEFINED_MESSAGES.thankYou;
                    nextStep = 'completed';

                    console.log('chatSessionddddddddddddddddddddddddddddddddddd', chatSession);
                    // Send email to admin
                    await sendEmailToAdmin(chatSession);
                } else {
                    botResponse = PREDEFINED_MESSAGES.invalidInput;
                }
                break;

            default:
                botResponse = PREDEFINED_MESSAGES.invalidInput;
        }

        // Add bot response to chat
        chatSession.messages.push({
            message: botResponse,
            isUser: false,
            timestamp: new Date()
        });

        // Update current step
        chatSession.currentStep = nextStep;
        
        // Save the updated chat session
        await chatSession.save();

        // Send real-time message to user if they're connected
        if (userId) {
            sendSupportMessageToUser(userId, {
                type: 'support_chat',
                sessionId,
                message: botResponse,
                isUser: false,
                timestamp: new Date()
            });
        }

        return res.status(200).json({
            message: "Message sent successfully",
            status: true,
            data: {
                sessionId: chatSession.sessionId,
                messages: chatSession.messages,
                currentStep: chatSession.currentStep
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const getSupportChatHistory = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.query;
        
        const chatSession = await supportChatModel.findOne({ sessionId, isActive: true });
        
        if (!chatSession) {
            return res.status(404).json({
                message: "Chat session not found",
                status: false,
                data: null
            });
        }

        return res.status(200).json({
            message: "Chat history retrieved successfully",
            status: true,
            data: {
                sessionId: chatSession.sessionId,
                messages: chatSession.messages,
                currentStep: chatSession.currentStep
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const getActiveSupportChats = async (req: any, res: Response) => {
    try {
        // Only admins can view all active support chats
        if (req.user?.role !== userRoles.Admin) {
            return res.status(403).json({
                message: "Access denied. Admin role required.",
                status: false,
                data: null
            });
        }

        const activeChats = await supportChatModel.find({ 
            isActive: true,
            currentStep: { $ne: 'completed' }
        }).sort({ updatedAt: -1 });

        return res.status(200).json({
            message: "Active support chats retrieved successfully",
            status: true,
            data: activeChats
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const closeSupportChat = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        
        const chatSession = await supportChatModel.findOne({ sessionId, isActive: true });
        
        if (!chatSession) {
            return res.status(404).json({
                message: "Chat session not found",
                status: false,
                data: null
            });
        }

        chatSession.isActive = false;
        await chatSession.save();

        return res.status(200).json({
            message: "Support chat closed successfully",
            status: true,
            data: null
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

// Helper function to send email to admin
async function sendEmailToAdmin(chatSession: any) {
    try {
        const adminUsers = await userModel.find({ role: userRoles.Admin });
        
        const emailSubject = "New Support Chat Request";
        const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Support Chat Request</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
                    .info-row { margin: 10px 0; padding: 8px; background-color: white; border-radius: 3px; }
                    .label { font-weight: bold; color: #495057; }
                    .value { color: #212529; }
                    .footer { text-align: center; margin-top: 20px; padding: 15px; color: #6c757d; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🚨 New Support Chat Request</h2>
                    </div>
                    <div class="content">
                        <p>A new support chat request has been received and requires your attention.</p>
                        
                        <div class="info-row">
                            <span class="label">Session ID:</span>
                            <span class="value">${chatSession.sessionId}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="label">User Name:</span>
                            <span class="value">${chatSession.userName || 'Anonymous'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="label">User Email:</span>
                            <span class="value">${chatSession.userEmail || 'Not provided'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="label">Question:</span>
                            <span class="value">${chatSession.userQuestion || 'Not provided'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="label">Timestamp:</span>
                            <span class="value">${new Date().toLocaleString()}</span>
                        </div>
                        
                        <p style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #007bff; border-radius: 3px;">
                            <strong>Action Required:</strong> Please respond to this support request as soon as possible.
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from the Support Chat System.</p>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Send email to all admin users
        for (const admin of adminUsers) {
            if (admin.email) {
                await sendMailForSupportChat(admin.email ? admin.email : 'darshandumaraliya@gmail.com', emailBody, emailSubject);
            }
        }
    } catch (error) {
        console.error("Error sending email to admin:", error);
    }
}
