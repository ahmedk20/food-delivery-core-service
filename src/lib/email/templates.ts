export function otpEmailTemplate(otp: string): string {
    return `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a;">Password Reset</h2>
            <p style="color: #555;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 13px;">If you didn't request this, ignore this email. Your password won't change.</p>
        </div>
    `;
}

export function memberInviteTemplate(name: string, otp: string): string {
    return `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a;">You've been invited</h2>
            <p style="color: #555;">Hi <strong>${name}</strong>, you've been added as a staff member.</p>
            <p style="color: #555;">Use the code below to set your password. It expires in <strong>1 hour</strong>.</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 13px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
        </div>
    `;
}
