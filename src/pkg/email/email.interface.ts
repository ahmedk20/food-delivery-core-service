export interface IEmailProvider {
    sendOtpEmail(to: string, otp: string): Promise<void>;
    sendMemberInvite(to: string, name: string, otp: string): Promise<void>;
}
