import {NextFunction, Response, Request} from "express";
import {validateBody} from "../../../common/validation/validate";
import {CreateMemberDTO, UpdateMemberDTO, UpdateMemberBranchesDTO} from "../dto/member.dto";
import {memberService} from "../service/member.service";

export class MemberController {
    createMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateMemberDTO, req.body);
            const result = await memberService.createMember(Number(req.params.restaurantId), data);
            res.status(200).send(result);
        } catch (error) {
            next(error);
        }
    }

    listMembers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await memberService.listMembers(Number(req.params.restaurantId));
            res.status(200).send(result);
        } catch (error) {
            next(error);
        }
    }

    updateMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateMemberDTO, req.body);
            await memberService.updateMember(
                Number(req.params.restaurantId),
                Number(req.params.memberId),
                data
            );
            res.status(200).send({ message: 'Member updated' });
        } catch (error) {
            next(error);
        }
    }

    deleteMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await memberService.deleteMember(
                Number(req.params.restaurantId),
                Number(req.params.memberId)
            );
            res.status(200).send({ message: 'Member deleted' });
        } catch (error) {
            next(error);
        }
    }

    updateMemberBranches = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateMemberBranchesDTO, req.body);
            await memberService.updateMemberBranches(
                Number(req.params.restaurantId),
                Number(req.params.memberId),
                data
            );
            res.status(200).send({ message: 'Member branches updated' });
        } catch (error) {
            next(error);
        }
    }

    getRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await memberService.getRolePermissions(req.params.role as string);
            res.status(200).send(result);
        } catch (error) {
            next(error);
        }
    }
}

export const memberController = new MemberController();
