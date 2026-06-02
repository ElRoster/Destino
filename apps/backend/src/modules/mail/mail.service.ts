import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import * as tls from 'tls';

type SmtpSocket = net.Socket | tls.TLSSocket;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmailConfirmation(to: string, verificationUrl: string) {
    this.logger.log(`Preparando correo de confirmacion para ${to}`);

    const subject = 'Confirma tu registro en Destino';
    const text = [
      'Gracias por registrarte en Destino.',
      'Confirma tu correo para activar tu cuenta:',
      verificationUrl,
      '',
      'Si no creaste esta cuenta, puedes ignorar este mensaje.',
    ].join('\n');

    const html = `
      <p>Gracias por registrarte en Destino.</p>
      <p>Confirma tu correo para activar tu cuenta:</p>
      <p><a href="${verificationUrl}">Confirmar mi cuenta</a></p>
      <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `;

    await this.sendMail({ to, subject, text, html });
  }

  private async sendMail(message: { to: string; subject: string; text: string; html: string }) {
    const host = this.configService.get<string>('SMTP_HOST');
    const from = this.configService.get<string>('SMTP_FROM', 'no-reply@tarot-platform.local');

    if (!host) {
      this.logger.warn(`SMTP_HOST no configurado. Enlace de confirmacion para ${message.to}: ${this.extractUrl(message.text)}`);
      return;
    }

    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const maskedUser = user ? this.maskEmail(user) : 'sin usuario';

    this.logger.log(
      `Intentando enviar correo a ${message.to} via SMTP ${host}:${port} secure=${secure} user=${maskedUser}`
    );

    const socket = await this.connect(host, port, secure);

    try {
      this.logger.debug(`Conexion SMTP abierta con ${host}:${port}`);
      await this.readResponse(socket);
      await this.command(socket, `EHLO ${this.configService.get<string>('SMTP_HELO', 'localhost')}`);
      this.logger.debug('SMTP EHLO aceptado');

      let activeSocket = socket;
      if (!secure) {
        this.logger.debug('Solicitando STARTTLS');
        await this.command(activeSocket, 'STARTTLS');
        activeSocket = tls.connect({ socket: activeSocket, servername: host });
        await new Promise<void>((resolve, reject) => {
          activeSocket.once('secureConnect', resolve);
          activeSocket.once('error', reject);
        });
        this.logger.debug('STARTTLS establecido');
        await this.command(activeSocket, `EHLO ${this.configService.get<string>('SMTP_HELO', 'localhost')}`);
      }

      if (user && pass) {
        this.logger.debug(`Autenticando SMTP como ${maskedUser}`);
        await this.command(activeSocket, 'AUTH LOGIN');
        await this.command(activeSocket, Buffer.from(user).toString('base64'));
        await this.command(activeSocket, Buffer.from(pass).toString('base64'));
        this.logger.debug('Autenticacion SMTP aceptada');
      } else {
        this.logger.warn('SMTP_USER o SMTP_PASS no configurados. Se intentara enviar sin autenticacion.');
      }

      this.logger.debug(`Enviando MAIL FROM ${this.emailAddress(from)} y RCPT TO ${message.to}`);
      await this.command(activeSocket, `MAIL FROM:<${this.emailAddress(from)}>`);
      await this.command(activeSocket, `RCPT TO:<${message.to}>`);
      await this.command(activeSocket, 'DATA');
      await this.writeData(activeSocket, this.buildMessage(from, message));
      this.logger.log(`Correo de confirmacion enviado correctamente a ${message.to}`);
      await this.command(activeSocket, 'QUIT', false);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo enviar correo a ${message.to}: ${messageText}`);
      throw error;
    } finally {
      socket.end();
    }
  }

  private connect(host: string, port: number, secure: boolean): Promise<SmtpSocket> {
    return new Promise((resolve, reject) => {
      const socket = secure ? tls.connect(port, host) : net.connect(port, host);
      socket.once(secure ? 'secureConnect' : 'connect', () => resolve(socket));
      socket.once('error', reject);
    });
  }

  private async command(socket: SmtpSocket, command: string, waitForResponse = true) {
    socket.write(`${command}\r\n`);
    if (waitForResponse) {
      await this.readResponse(socket);
    }
  }

  private readResponse(socket: SmtpSocket): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: string[] = [];
      const onData = (chunk: Buffer) => {
        chunks.push(chunk.toString('utf8'));
        const response = chunks.join('');
        const lines = response.trimEnd().split(/\r?\n/);
        const last = lines[lines.length - 1];

        if (/^\d{3} /.test(last)) {
          socket.off('data', onData);
          socket.off('error', onError);

          if (/^[45]\d{2}/.test(last)) {
            reject(new Error(`SMTP error: ${response}`));
            return;
          }

          resolve(response);
        }
      };
      const onError = (error: Error) => {
        socket.off('data', onData);
        reject(error);
      };

      socket.on('data', onData);
      socket.once('error', onError);
    });
  }

  private async writeData(socket: SmtpSocket, data: string) {
    socket.write(`${data}\r\n.\r\n`);
    await this.readResponse(socket);
  }

  private buildMessage(from: string, message: { to: string; subject: string; text: string; html: string }) {
    const boundary = `boundary-${Date.now()}`;
    return [
      `From: ${from}`,
      `To: ${message.to}`,
      `Subject: ${this.encodeHeader(message.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      message.text,
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      message.html,
      `--${boundary}--`,
    ].join('\r\n');
  }

  private encodeHeader(value: string) {
    return `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
  }

  private emailAddress(value: string) {
    const match = value.match(/<([^>]+)>/);
    return match?.[1] ?? value;
  }

  private extractUrl(text: string) {
    return text.split(/\s+/).find((part) => part.startsWith('http')) ?? '';
  }

  private maskEmail(value: string) {
    const [name, domain] = value.split('@');

    if (!domain) {
      return '***';
    }

    const visible = name.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
  }
}
