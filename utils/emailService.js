const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
        }
    });
};

/**
 * Send 6-digit OTP verification email to user
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @param {string} username - User full name / username
 */
const sendOtpEmail = async (toEmail, otp, username = 'Valued Member') => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"VortexBuy Security" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `${otp} is your VortexBuy Verification Code`,
            text: `Hello ${username},\n\nYour 6-digit verification code for VortexBuy is: ${otp}\n\nThis code will expire in 15 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nVortexBuy Team`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>VortexBuy Verification Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #0b0b0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0b0b; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #141414; border-radius: 24px; border: 1px solid #262626; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 36px 40px 20px 40px; text-align: center; border-bottom: 1px solid #222222;">
                          <div style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #F35C7A, #ea580c); border-radius: 14px; line-height: 44px; font-weight: 900; font-size: 22px; color: #ffffff; margin-bottom: 12px; box-shadow: 0 8px 16px rgba(243,92,122,0.3);">V</div>
                          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">VORTEX<span style="color: #F35C7A;">BUY</span></h1>
                        </td>
                      </tr>
                      
                      <!-- Body -->
                      <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center;">
                          <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Verify Your Identity</h2>
                          <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                            Hello <strong style="color: #ffffff;">${username}</strong>,<br>
                            Please enter the single-use authorization code below to verify your email address and activate your account.
                          </p>
                          
                          <!-- OTP Box -->
                          <div style="background: #1c1c1c; border: 2px dashed #F35C7A; border-radius: 16px; padding: 22px; margin: 0 auto 28px auto; max-width: 300px;">
                            <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-align: center;">
                              ${otp}
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: #F35C7A; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px;">
                              Valid for 15 minutes
                            </div>
                          </div>
                          
                          <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                            If you did not initiate this request, you can safely disregard this email. Your account remains protected.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 24px 40px; text-align: center; background-color: #0d0d0d; border-top: 1px solid #1f1f1f;">
                          <p style="margin: 0; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px;">
                            &copy; ${new Date().getFullYear()} VortexBuy. Curated Luxury Commerce.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] OTP successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[Email Service] Error sending OTP to ${toEmail}:`, err);
        throw err;
    }
};

module.exports = {
    sendOtpEmail
};
