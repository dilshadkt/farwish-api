const createEmailTemplate = (otp) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email - FARWISH</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 20px 0;">
              <table align="center" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #F6EEFE; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #333333; margin: 0; font-size: 24px;">FARWISH</h1>
                    <p style="color: #666666; margin: 10px 0 0;">Email Verification</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px;">Hello!</h2>
                    <p style="color: #666666; margin: 0 0 20px; line-height: 1.5;">Thank you for choosing FARWISH. Use the following OTP to complete your registration process.</p>
                    
                    <!-- OTP Box -->
                    <div style="background-color: #F6EEFE; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                      <h2 style="color: #333333; margin: 0; letter-spacing: 5px; font-size: 32px;">${otp}</h2>
                    </div>
                    
                    <p style="color: #666666; margin: 20px 0; line-height: 1.5;">This OTP will expire in 10 minutes for security reasons.</p>
                    
                    <div style="border-left: 4px solid #F6EEFE; padding-left: 15px; margin: 20px 0;">
                      <p style="color: #666666; margin: 0; line-height: 1.5;">If you didn't request this verification, please ignore this email.</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #F6EEFE; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #666666; margin: 0 0 10px; font-size: 14px;">© 2024 FARWISH. All rights reserved.</p>
                    <div style="margin-top: 10px;">
                      <a href="#" style="color: #666666; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                      <a href="#" style="color: #666666; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
};

module.exports = createEmailTemplate;
