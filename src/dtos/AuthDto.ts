import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class RegisterDto {
  @IsString({ message: "Username must be a string" })
  @MinLength(3, { message: "Username must be at least 3 characters long" })
  @MaxLength(30, { message: "Username must not exceed 30 characters" })
  username!: string;

  @IsString({ message: "Password must be a string" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(100, { message: "Password must not exceed 100 characters" })
  password!: string;
}

export class LoginDto {
  @IsString({ message: "Username must be a string" })
  username!: string;

  @IsString({ message: "Password must be a string" })
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: "Username must be a string" })
  @MinLength(3, { message: "Username must be at least 3 characters long" })
  @MaxLength(30, { message: "Username must not exceed 30 characters" })
  username?: string;

  @IsOptional()
  @IsString({ message: "Password must be a string" })
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(100, { message: "Password must not exceed 100 characters" })
  password?: string;
}
