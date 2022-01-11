import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-tokens.entity';

// TODO: Use my app's url
const BASE_OPTIONS: SignOptions = {
  issuer: 'https://my-app.com',
  audience: 'https://my-app.com',
};

export interface RefreshTokenPayload {
  jti: number;
  sub: number;
}

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const opts: SignOptions = {
      ...BASE_OPTIONS,
      subject: String(user.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  async generateRefreshToken(user: User, expiresIn: number): Promise<string> {
    const refreshToken = await this.createRefreshToken(user, expiresIn);

    const opts: SignOptions = {
      ...BASE_OPTIONS,
      expiresIn,
      jwtid: String(refreshToken.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  /**
   * Decodes and validates refresh token
   */
  async resolveRefreshToken(
    encodedRefreshToken: string,
  ): Promise<{ user: User; refreshToken: RefreshToken }> {
    const { jti: refreshTokenId } = await this.decodeRefreshToken(
      encodedRefreshToken,
    );

    if (!refreshTokenId) {
      throw new Error('Refresh token malformed');
    }

    const refreshToken = await this.refreshTokensRepository.findOne({
      where: { id: refreshTokenId },
    });

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    if (refreshToken.isRevoked) {
      throw new Error('Refresh token revoked');
    }

    const user = await this.usersService.findById(refreshToken.userId);

    return { user, refreshToken };
  }

  async createAccessTokenFromRefreshToken(
    refreshToken: string,
  ): Promise<{ token: string; user: User }> {
    const { user } = await this.resolveRefreshToken(refreshToken);

    const token = await this.generateAccessToken(user);

    return { user, token };
  }

  private async decodeRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else {
        throw new Error('Refresh token malformed');
      }
    }
  }

  /**
   *
   * @param user The user the refresh token is for
   * @param ttl The amount of time in seconds until expiration (time-to-live)
   * @returns
   */
  private async createRefreshToken(
    user: User,
    ttl: number,
  ): Promise<RefreshToken> {
    const token = new RefreshToken();

    token.userId = user.id;
    token.isRevoked = false;

    const expiration = new Date();
    expiration.setTime(expiration.getTime() + ttl);

    token.expires = expiration;

    return this.refreshTokensRepository.save(token);
  }

  async revokeRefreshToken(encodedRefreshToken: string) {
    const { refreshToken } = await this.resolveRefreshToken(
      encodedRefreshToken,
    );

    refreshToken.isRevoked = true;

    return this.refreshTokensRepository.save(refreshToken);
  }
}
