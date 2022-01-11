import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response';
import { UserAuthInput } from './dto/user-auth.input';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(@Args('loginUserInput') loginUserInput: UserAuthInput) {
    return this.authService.login(loginUserInput);
  }

  @Mutation(() => AuthResponse)
  signup(@Args('signupUserInput') signupUserInput: UserAuthInput) {
    return this.authService.signup(signupUserInput);
  }
}
