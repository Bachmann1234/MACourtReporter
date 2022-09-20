import express, { Request, Response } from 'express';
import runTweetTask from "./tweetBill";
import Pino from "pino";
import {config} from "dotenv";
import updateBillsInDb from "./updateBillsInDb";

config();

const app = express();
const port = 8080;
const logger = Pino();

app.get( "/", ( req:Request, res: Response ) => {
    res.send( "Hello!");
} );


app.post( "/updateBills", ( req:Request, res: Response ) => {
    const apiKey = req.header("apikey")
    if (!process.env.API_KEY || process.env.PORT !== apiKey) {
        res.status(403);
        res.send( "Access Denied!");
    } else {
        updateBillsInDb().then(() => res.send("Done!")).catch(e => {
            logger.error(e);
            res.status(500);
            res.send("Failed to tweet bill");
        })
    }
} );

app.post( "/tweetBill", ( req:Request, res: Response ) => {
    const apiKey = req.header("apikey")
    if (!process.env.API_KEY || process.env.PORT !== apiKey) {
        res.status(403);
        res.send( "Access Denied!");
    } else {
        runTweetTask().then(() => res.send("Done!")).catch(e => {
            logger.error(e);
            res.status(500);
            res.send("Failed to tweet bill");
        })
    }
} );


app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );