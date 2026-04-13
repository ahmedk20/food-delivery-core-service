import {NodemailerEmailProvider} from '../../pkg/email/nodemailer';
import {env} from '../config/env';

export const emailProvider = new NodemailerEmailProvider({
    host:     env.email.host,
    port:     env.email.port,
    user:     env.email.user,
    password: env.email.password,
    from:     env.email.from,
});
