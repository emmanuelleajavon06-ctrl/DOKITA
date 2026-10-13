import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Roles, RolesGuard } from "../common/roles";
import { PrismaService } from "../prisma.service";
import { FaqDto, MediaDto, PageDto, PartnerDto, SocialDto, UpdateFaqDto, UpdatePageDto, UpdatePartnerDto, UpdateSocialDto } from "./cms.dto";
import { MediaService } from "./media.service";

const ORDER = [{ sortOrder: "asc" as const }, { id: "asc" as const }];

/** Contenu visible par tous (accueil, FAQ, partenaires, réseaux) : uniquement les éléments publiés. */
@Controller("public")
export class PublicController {
  constructor(private readonly p: PrismaService) {}

  @Get("site")
  async site(@Res({ passthrough: true }) res: Response) {
    res.setHeader("Cache-Control", "public, max-age=60");
    const where = { isPublished: true };
    const [partners, faqs, socials, pages, media] = await Promise.all([
      this.p.partner.findMany({ where, orderBy: ORDER, take: 100 }),
      this.p.faq.findMany({ where, orderBy: ORDER, take: 100 }),
      this.p.socialLink.findMany({ where, orderBy: ORDER, take: 20 }),
      this.p.sitePage.findMany({ where, select: { slug: true, title: true }, take: 50 }),
      this.p.media.findMany({ orderBy: ORDER, take: 50 }),
    ]);
    return { partners, faqs, socials, pages, media };
  }

  @Get("pages/:slug")
  async page(@Param("slug") slug: string) {
    const page = await this.p.sitePage.findFirst({ where: { slug, isPublished: true } });
    if (!page) throw new NotFoundException();
    return page;
  }
}

/** Espace administrateur de la plateforme : réservé au SUPER_ADMIN. */
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class AdminCmsController {
  constructor(private readonly p: PrismaService, private readonly media: MediaService) {}

  @Get("partners") partners() { return this.p.partner.findMany({ orderBy: ORDER, take: 200 }); }
  @Post("partners") addPartner(@Body() d: PartnerDto) { return this.p.partner.create({ data: d }); }
  @Patch("partners/:id") editPartner(@Param("id") id: string, @Body() d: UpdatePartnerDto) { return this.p.partner.update({ where: { id }, data: d }); }
  @Delete("partners/:id") async delPartner(@Param("id") id: string) { await this.p.partner.delete({ where: { id } }); return { ok: true }; }

  @Get("faqs") faqs() { return this.p.faq.findMany({ orderBy: ORDER, take: 200 }); }
  @Post("faqs") addFaq(@Body() d: FaqDto) { return this.p.faq.create({ data: d }); }
  @Patch("faqs/:id") editFaq(@Param("id") id: string, @Body() d: UpdateFaqDto) { return this.p.faq.update({ where: { id }, data: d }); }
  @Delete("faqs/:id") async delFaq(@Param("id") id: string) { await this.p.faq.delete({ where: { id } }); return { ok: true }; }

  @Get("socials") socials() { return this.p.socialLink.findMany({ orderBy: ORDER, take: 20 }); }
  @Post("socials") addSocial(@Body() d: SocialDto) { return this.p.socialLink.create({ data: d }); }
  @Patch("socials/:id") editSocial(@Param("id") id: string, @Body() d: UpdateSocialDto) { return this.p.socialLink.update({ where: { id }, data: d }); }
  @Delete("socials/:id") async delSocial(@Param("id") id: string) { await this.p.socialLink.delete({ where: { id } }); return { ok: true }; }

  @Get("pages") pages() { return this.p.sitePage.findMany({ orderBy: { slug: "asc" }, take: 100 }); }
  @Post("pages") addPage(@Body() d: PageDto) { return this.p.sitePage.create({ data: d }); }
  @Patch("pages/:id") editPage(@Param("id") id: string, @Body() d: UpdatePageDto) { return this.p.sitePage.update({ where: { id }, data: d }); }
  @Delete("pages/:id") async delPage(@Param("id") id: string) { await this.p.sitePage.delete({ where: { id } }); return { ok: true }; }

  @Get("media") mediaList() { return this.p.media.findMany({ orderBy: ORDER, take: 200 }); }
  @Post("media") @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() d: MediaDto) { return this.media.upload(file, d); }
  @Delete("media/:id") async delMedia(@Param("id") id: string) { await this.media.remove(id); return { ok: true }; }
}
