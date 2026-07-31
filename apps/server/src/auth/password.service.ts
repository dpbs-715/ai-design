import { Injectable } from '@nestjs/common'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const PASSWORD_HASH_VERSION = 'scrypt-v1'
const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEY_BYTES = 64
const SCRYPT_COST = 16_384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1
const SCRYPT_MAX_MEMORY_BYTES = 64 * 1024 * 1024

@Injectable()
export class PasswordService {
  private readonly dummyHash = this.hash('invalid-password-placeholder')

  async hash(password: string): Promise<string> {
    const salt = randomBytes(PASSWORD_SALT_BYTES)
    const derivedKey = await this.deriveKey(password, salt)

    return [
      PASSWORD_HASH_VERSION,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$')
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [version, encodedSalt, encodedKey] = passwordHash.split('$')

    if (version !== PASSWORD_HASH_VERSION || !encodedSalt || !encodedKey) {
      return false
    }

    const salt = Buffer.from(encodedSalt, 'base64url')
    const expectedKey = Buffer.from(encodedKey, 'base64url')

    if (salt.length !== PASSWORD_SALT_BYTES || expectedKey.length !== PASSWORD_KEY_BYTES) {
      return false
    }

    const actualKey = await this.deriveKey(password, salt)
    return timingSafeEqual(actualKey, expectedKey)
  }

  async verifyOrDummy(password: string, passwordHash?: string): Promise<boolean> {
    return this.verify(password, passwordHash ?? (await this.dummyHash))
  }

  private deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        PASSWORD_KEY_BYTES,
        {
          N: SCRYPT_COST,
          r: SCRYPT_BLOCK_SIZE,
          p: SCRYPT_PARALLELIZATION,
          maxmem: SCRYPT_MAX_MEMORY_BYTES,
        },
        (error, derivedKey) => {
          if (error) {
            reject(error)
            return
          }

          resolve(derivedKey)
        },
      )
    })
  }
}
