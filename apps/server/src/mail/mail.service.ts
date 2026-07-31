import { EMAIL_VERIFICATION_CODE_TTL_SECONDS } from '@ai-design/contracts/auth'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'

import type { EnvironmentVariables } from '../config/environment.js'

@Injectable()
export class MailService {
  private readonly sender: string
  private readonly transporter: nodemailer.Transporter

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.sender = config.get('SMTP_FROM', { infer: true })
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', { infer: true }),
      port: config.get('SMTP_PORT', { infer: true }),
      secure: config.get('SMTP_SECURE', { infer: true }),
      auth: {
        user: config.get('SMTP_USER', { infer: true }),
        pass: config.get('SMTP_PASSWORD', { infer: true }),
      },
    })
  }

  async verifyConnection(): Promise<void> {
    await this.transporter.verify()
  }

  async sendVerificationCode(recipient: string, code: string): Promise<void> {
    const validMinutes = EMAIL_VERIFICATION_CODE_TTL_SECONDS / 60

    await this.transporter.sendMail({
      from: {
        name: 'AI Design',
        address: this.sender,
      },
      to: recipient,
      subject: 'AI Design 邮箱验证码',
      text: `你的验证码是 ${code}，${validMinutes} 分钟内有效。请勿将验证码告诉他人。`,
      html: [
        '<p>你正在注册 AI Design。</p>',
        `<p>邮箱验证码：<strong style="font-size: 24px; letter-spacing: 4px">${code}</strong></p>`,
        `<p>验证码 ${validMinutes} 分钟内有效，请勿将验证码告诉他人。</p>`,
      ].join(''),
    })
  }
}
