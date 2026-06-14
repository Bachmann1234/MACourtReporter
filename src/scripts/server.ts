import { config } from 'dotenv';
import express, { type Request, type Response } from 'express';
import Pino from 'pino';
import runTweetTask from './tweetBill';
import updateBillsInDb from './updateBillsInDb';

config({ quiet: true });

const app = express();
const port = 8080;
const logger = Pino();

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello!');
});

app.post('/updateBills', (req: Request, res: Response) => {
  const apiKey = req.header('apikey');
  if (!process.env.API_KEY || process.env.API_KEY !== apiKey) {
    res.status(403);
    res.send('Access Denied!');
  } else {
    updateBillsInDb()
      .then(() => res.send('Done!'))
      .catch((e) => {
        logger.error(e);
        res.status(500);
        res.send('Failed to update bills');
      });
  }
});

app.post('/tweetBill', (req: Request, res: Response) => {
  const apiKey = req.header('apikey');
  if (!process.env.API_KEY || process.env.API_KEY !== apiKey) {
    res.status(403);
    res.send('Access Denied!');
  } else {
    runTweetTask()
      .then(() => res.send('Done!'))
      .catch((e) => {
        logger.error(e);
        res.status(500);
        res.send('Failed to tweet bill');
      });
  }
});

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
