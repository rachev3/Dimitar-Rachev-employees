import { IsString, IsNotEmpty } from "class-validator";

export class CreateProjectDto {
  @IsString({ message: "Project name must be a string" })
  @IsNotEmpty({ message: "Project name cannot be empty" })
  name!: string;
}

export class UpdateProjectDto {
  @IsString({ message: "Project name must be a string" })
  @IsNotEmpty({ message: "Project name cannot be empty" })
  name!: string;
}
