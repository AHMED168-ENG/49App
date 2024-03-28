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


oauth2Client.setCredentials({
  refresh_token: "1//04AruWOtl-2SlCgYIARAAGAQSNwF-L9Ir1TG8Q8nxj77AIvz-n5PRRhjCoTuUJrdMiG7civftpfe70hXy75iMafLcu4ZUGn-mGlw"
});
export async function SendMails(data) {
  const access_token = await oauth2Client.getAccessToken()
  console.log(access_token.token)
    let transporter = nodemailer.createTransport({
        service:process.env.NODEMAILER_SERVICE,
        auth: {
          type : "OAuth2",
          user: process.env.NODEMAILER_USERNAME,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          accessToken : access_token.token,
          refresh_token: "1//04AruWOtl-2SlCgYIARAAGAQSNwF-L9Ir1TG8Q8nxj77AIvz-n5PRRhjCoTuUJrdMiG7civftpfe70hXy75iMafLcu4ZUGn-mGlw"
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