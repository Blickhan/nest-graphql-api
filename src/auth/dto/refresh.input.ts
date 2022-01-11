import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RefreshInput {
  @Field()
  refreshToken: string;
}
