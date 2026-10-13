import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min } from "class-validator";

// Seuls http(s) sont acceptés : bloque javascript:, data:, etc.
const URL_OPTS = { protocols: ["http", "https"], require_protocol: true, require_tld: false };
export const PLATFORMS = ["TIKTOK", "FACEBOOK", "INSTAGRAM", "YOUTUBE", "X", "LINKEDIN", "WHATSAPP"] as const;
export const MEDIA_KINDS = ["HERO", "GALLERY", "LOGO"] as const;

export class PartnerDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsOptional() @IsUrl(URL_OPTS) @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsUrl(URL_OPTS) @MaxLength(500) websiteUrl?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class UpdatePartnerDto extends PartialType(PartnerDto) {}

export class FaqDto {
  @IsString() @IsNotEmpty() @MaxLength(300) question!: string;
  @IsString() @IsNotEmpty() @MaxLength(5000) answer!: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class UpdateFaqDto extends PartialType(FaqDto) {}

export class SocialDto {
  @IsIn(PLATFORMS) platform!: (typeof PLATFORMS)[number];
  @IsUrl(URL_OPTS) @MaxLength(500) url!: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class UpdateSocialDto extends PartialType(SocialDto) {}

export class PageDto {
  @Matches(/^[a-z0-9-]{2,60}$/, { message: "slug : minuscules, chiffres et tirets" }) slug!: string;
  @IsString() @IsNotEmpty() @MaxLength(150) title!: string;
  @IsString() @MaxLength(20000) content!: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
export class UpdatePageDto extends PartialType(PageDto) {}

export class MediaDto {
  @IsIn(MEDIA_KINDS) kind!: (typeof MEDIA_KINDS)[number];
  @IsOptional() @IsString() @MaxLength(200) alt?: string;
}
