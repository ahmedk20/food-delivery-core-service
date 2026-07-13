import {Request, Response, NextFunction} from "express";
import {injectable, inject} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";
import {validateBody} from "../../../lib/validation/validate";
import {SystemRole} from "../../user/enums";
import {CreateUploadUrlDTO} from "../dto/media.dto";
import {MediaService} from "../service/media.service";

@injectable()
export class MediaController {
    constructor(@inject(TOKENS.MediaService) private readonly mediaService: MediaService) {
    }

    createUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateUploadUrlDTO, req.body);
            const result = await this.mediaService.createUploadUrl(
                req.user?.userId!,
                req.user?.role! as SystemRole,
                req.user?.restaurantId,
                data,
            );
            sendSuccess(res, {message: "Upload url created", ...result}, 201);
        } catch (err) {
            next(err);
        }
    }

    confirmUpload = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const media = await this.mediaService.confirmUpload(
                Number(req.params.id),
                req.user?.userId!,
                req.user?.role! as SystemRole,
            );
            sendSuccess(res, {message: "Upload confirmed", media});
        } catch (err) {
            next(err);
        }
    }
}
