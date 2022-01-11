import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth.response';
import { AuthInput } from './dto/auth.input';
import { RefreshResponse } from './dto/refresh.response';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  login(@Args('loginUserInput') loginUserInput: AuthInput) {
    return this.authService.login(loginUserInput);
  }

  @Mutation(() => AuthResponse)
  signup(@Args('signupUserInput') signupUserInput: AuthInput) {
    return this.authService.signup(signupUserInput);
  }

  @Mutation(() => RefreshResponse)
  refreshAuth(@Args('refreshToken') refreshToken: string) {
    return this.authService.refreshAuth(refreshToken);
  }

  @Mutation(() => Boolean)
  logout(@Args('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
