import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const lower = ({ value }: { value: unknown }): unknown => (typeof value === "string" ? value.trim().toLowerCase() : value);

export class LoginDto {
  @Transform(lower) @IsEmail() email!: string;
  @IsString() @MinLength(1) @MaxLength(72) password!: string;
}

export class RegisterDto extends LoginDto {
  @IsString() @MinLength(10, { message: "Mot de passe : 10 caractères minimum" }) @MaxLength(72) declare password: string;
  @IsString() @IsNotEmpty() @MaxLength(60) firstName!: string;
  @IsString() @IsNotEmpty() @MaxLength(60) lastName!: string;
  @IsOptional() @Matches(/^\+?[0-9 ]{8,16}$/, { message: "Numéro de téléphone invalide" }) phone?: string;
}
