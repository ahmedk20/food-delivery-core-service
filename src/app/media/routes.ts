import {Router} from "express";
import {authenticate} from "../../lib/auth/guard";
import {TOKENS} from "../../lib/di/tokens";
import {container} from "../../lib/di/container";
import {MediaController} from "./controller/media.controller";

export const mediaRouter = Router();

const mediaController = container.resolve<MediaController>(TOKENS.MediaController);

// Role is enforced in the service (system_admin OR restaurant_user), since a
// simple single-role guard can't express the "either" case.
mediaRouter.post('/upload-url', authenticate, mediaController.createUploadUrl);
mediaRouter.post('/:id/confirm', authenticate, mediaController.confirmUpload);
