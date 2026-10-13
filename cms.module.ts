import { Module } from "@nestjs/common";
import { AdminCmsController, PublicController } from "./cms.controller";
import { MediaService } from "./media.service";

@Module({ controllers: [PublicController, AdminCmsController], providers: [MediaService] })
export class CmsModule {}
