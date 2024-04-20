import nodemailer from "nodemailer";
import { google } from "googleapis";
import dontenv from 'dotenv'
dontenv.config()
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

export async function SendMails(data) {
  oauth2Client.setCredentials({
    refresh_token:process.env.REFRESH_TOKEN
  });

    let transporter = nodemailer.createTransport({
        service:process.env.NODEMAILER_SERVICE,
        auth: {
          type : "OAuth2",
          user: process.env.NODEMAILER_USERNAME,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refresh_token: process.env.REFRESH_TOKEN,
          accessToken : "ya29.a0Ad52N39KxiWDcEfZ5BNhBI_Zw5H2LkK5O_iOoyaTQfaJ85eli4v6-k058A_XmmUE-aiMgrgz_rbcdq658D9VMaBk8PjWQxdtUt6maWB72PyGp80u2eYG_FBOvHxwBxn0XqZE0_FhywTSc6Gg2z7ffi9ZShX26QOxPexnaCgYKARYSARISFQHGX2MiehWDnSY78VORCZpxXC91Xw0171",
        },
        tls: {
          rejectUnauthorized: false
        }
    });
    let mailOptions = {
      from: "ahmedzakydev@gmail.com",
      to: data.email,
      subject: data.subject,
      html: `<!DOCTYPE html>
    <html lang="en">
        <head>
            <title></title>
            <meta charset="UTF-8">    
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="css/style.css" rel="stylesheet">
        </head>
        <body>
            <h3>welcome mr  ${data.fName} ${data.lName} in my application </h3>
            <p>We care about your safety</p>
            <p>${data.subject}</p>
            ${data.url ? `<a href='${data.url}'>click hir</a>` : ""}
            ${data.otp ? `<input class='' value='${data.otp}' style="padding:7px 15px ; border:1px solid #ddd;" />` : "" }
        </body>
    </html>`,
    };
  
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }