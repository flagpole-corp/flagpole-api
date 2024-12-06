import { IsString, IsNotEmpty } from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;
}
