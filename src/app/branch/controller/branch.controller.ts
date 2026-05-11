import {Request, Response, NextFunction} from "express";
import {validateBody} from "../../../lib/validation/validate";
import {SystemRole} from "../../user/enums";
import {CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO} from "../dto/branch.dto";
import {BranchService} from "../service/branch.service";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";

@injectable()
export class BranchController {
    constructor(@inject(TOKENS.BranchService) private readonly branchService: BranchService) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateBranchDTO, req.body);
            const branch = await this.branchService.create(Number(req.params.restaurantId), req.user?.userId!, req.user?.role! as SystemRole, data);
            sendSuccess(res, { message: "Branch added", branch }, 201);
        } catch (err) {
            next(err);
        }
    }

    findNearby = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await this.branchService.findNearby(Number(req.query.lat), Number(req.query.lng));
            sendSuccess(res, results);
        } catch (err) {
            next(err);
        }
    }

    findByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.branchService.findByRestaurant(
                Number(req.params.restaurantId),
                req.query as Record<string, any>,
            );
            sendSuccess(res, result.data, 200, result.meta);
        } catch (err) {
            next(err);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchDTO, req.body);
            const branch = await this.branchService.update(
                Number(req.params.id),
                req.user?.userId!,
                req.user?.role! as SystemRole,
                data
            );
            sendSuccess(res, { message: "Branch updated successfully", branch });
        } catch (err) {
            next(err);
        }
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchStatusDTO, req.body);
            const branch = await this.branchService.updateStatus(
                Number(req.params.id),
                req.user?.role! as SystemRole,
                data
            );
            sendSuccess(res, { message: "Branch status updated successfully", branch });
        } catch (err) {
            next(err);
        }
    }
}
