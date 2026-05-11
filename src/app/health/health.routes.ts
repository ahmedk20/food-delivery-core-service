import {Router} from "express";
import {Request, Response} from "express";
import {pingDB} from "../../lib/knex/knex.js";

export const healthRouter = Router();
healthRouter.get('/', async (req:Request, res:Response) => {
    try {
        await pingDB();
        return res.status(200).json({"ok": true});
    }catch(err){
        res.status(500).json({message: "database error"});
    }
});