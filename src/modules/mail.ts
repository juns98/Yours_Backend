import nodemailer from 'nodemailer';
import path from 'path';
import config from '../config';
import * as ejs from 'ejs';

const sendMail = async (code: string, email: string) => {
  let authEmailForm;

  const clientAddr =
    config.env === 'production' ? process.env.CLIENT_ADDR : 'localhost:8000';
  const dirPath = path.join(__dirname, '../../ejs/authEmailContent.ejs');
  ejs.renderFile(dirPath, { clientAddr, code, email }, (error, data) => {
    if (error) console.log(error);
    authEmailForm = data;
  });

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.authMailUser,
      pass: config.authMailPassWord,
    },
  });

  await transporter.sendMail({
    from: `YOURS NFT 인증 <${config.authMailUser}>`,
    to: email,
    subject: `NFT 인증`,
    html: authEmailForm,
  });
};

const sendAuthEmail = async (code: number, email: string) => {
  let authEmailForm;

  const dirPath = path.join(__dirname, '../../ejs/authAuthEmail.ejs');
  ejs.renderFile(dirPath, { code, email }, (error, data) => {
    if (error) console.log(error);
    authEmailForm = data;
  });

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.authMailUser,
      pass: config.authMailPassWord,
    },
  });

  await transporter.sendMail({
    from: `YOURS 이메일 인증 <${config.authMailUser}>`,
    to: email,
    subject: `변경하고자 이메일 인증`,
    html: authEmailForm,
  });
};

export { sendMail, sendAuthEmail };
