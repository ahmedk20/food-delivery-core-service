import nodemailer, {Transporter} from 'nodemailer';
import type {IEmailProvider} from './email.interface';
import {otpEmailTemplate, memberInviteTemplate} from '../../lib/email/templates';

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
}

export class NodemailerEmailProvider implements IEmailProvider {
    private readonly transporter: Transporter;
    private readonly from: string;

    constructor(config: SmtpConfig) {
        this.from = config.from;
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465, // true for port 465 (SSL), false for 587 (TLS)
            auth: {
                user: config.user,
                pass: config.password,
            },
        });
    }

    async sendOtpEmail(to: string, otp: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.from,
            to,
            subject: 'Your password reset code',
            html: otpEmailTemplate(otp),
        });
    }

    async sendMemberInvite(to: string, name: string, otp: string): Promise<void> {
        await this.transporter.sendMail({
            from: this.from,
            to,
            subject: 'You have been invited',
            html: memberInviteTemplate(name, otp),
        });
    }
}
