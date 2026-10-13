import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma.service";
import type { MediaDto } from "./cms.dto";

// On vérifie le contenu réel du fichier (octets magiques), pas seulement le type annoncé par le client.
const FORMATS: Array<{ ext: string; mime: string; test: (b: Buffer) => boolean }> = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  { ext: "webp", mime: "image/webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

@Injectable()
export class MediaService {
  private readonly bucket = process.env.S3_BUCKET ?? "samadokita";
  private readonly s3 = new S3Client({
    region: "us-east-1", endpoint: process.env.S3_ENDPOINT, forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "", secretAccessKey: process.env.S3_SECRET_KEY ?? "" },
  });
  constructor(private readonly prisma: PrismaService) {}

  async upload(file: Express.Multer.File | undefined, dto: MediaDto) {
    if (!process.env.S3_ACCESS_KEY || !process.env.S3_ENDPOINT) throw new ServiceUnavailableException("Stockage d'images non configuré (variables S3_*)");
    if (!file) throw new BadRequestException("Fichier manquant");
    const fmt = FORMATS.find((f) => f.test(file.buffer));
    if (!fmt) throw new BadRequestException("Format non autorisé (JPEG, PNG ou WebP uniquement)");
    const key = `media/${randomUUID()}.${fmt.ext}`;
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: fmt.mime, CacheControl: "public, max-age=31536000, immutable" }));
    const base = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
    return this.prisma.media.create({ data: { key, url: `${base}/${this.bucket}/${key}`, kind: dto.kind, alt: dto.alt } });
  }

  async remove(id: string): Promise<void> {
    const m = await this.prisma.media.delete({ where: { id } });
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: m.key })).catch(() => undefined);
  }
}
