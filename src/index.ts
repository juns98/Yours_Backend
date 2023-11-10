import express, { NextFunction, Request, Response } from 'express';
import router from './routes/index';
import cors from 'cors';
import config from './config';
import generalErrorHandler from './middlewares/error/errorHandler';
import { connectRedis } from './loader/redis';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { logger, stream } from './config/logger';
import morgan from 'morgan';

const app = express();

Sentry.init({
  dsn: config.sentryDsn,
  environment: config.sentryEnvironment,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});
connectRedis();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
app.use(Sentry.Handlers.tracingHandler());
const allowedOrigins = [
  'http://localhost:3000',
  config.ec2URL,
  'http://yoursnft.me',
  'https://api.yoursnft.me',
  'https://www.yoursnft.me',
  'https://justmint.yoursnft.me',
  'https://aptos.yoursnft.me',
  'https://yoursnft.me',
  'http://192.168.0.84:3000',
  'http://192.168.0.110:3000',
  'https://bos.gg/',
  'https://marketplace.yoursnft.me',
];
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  const origin: string = req.headers.origin!;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, content-type, x-access-token',
  );
  next();
});

app.use(morgan('combined', { stream: stream }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', router);
app.use(Sentry.Handlers.errorHandler());
app.use(generalErrorHandler);
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('Yours SERVER');
});

app.listen(config.port, () => {
  logger.info('서버가 시작되었습니다.');
  console.log(`
        #############################################
            🛡️ Server listening on port: ${config.port} 🛡️
        #############################################
    `);
});
